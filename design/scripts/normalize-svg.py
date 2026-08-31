#!/usr/bin/env python3
"""Bake transform= attributes out of an Illustrator SVG export.

Why: ImageMagick's built-in SVG renderer silently drops <rect> elements that carry
a rotate() transform with non-zero x/y -- in this logo that is the `l` of "talmo",
so IM renders the wordmark as "ta molab" with no error. Baking the transform into
plain geometry makes the file render identically everywhere.

Illustrator reintroduces the transform on every re-export, so re-run this after
exporting a new master from the .ai file.

    python3 normalize-svg.py ../../talmolab-logo.v002.svg [--check]

--check exits non-zero if any transform remains, for CI or a pre-commit hook.
"""
import math, re, shutil, sys

TOL = 0.05  # viewBox units; below this a rotated rect is treated as axis-aligned


def parse_transform(t):
    """Return a 2x3 affine (a,b,c,d,e,f) for a transform list, applied left to right."""
    M = (1.0, 0.0, 0.0, 1.0, 0.0, 0.0)
    for name, args in re.findall(r'(\w+)\s*\(([^)]*)\)', t):
        v = [float(n) for n in re.split(r'[\s,]+', args.strip()) if n]
        if name == 'translate':
            N = (1, 0, 0, 1, v[0], v[1] if len(v) > 1 else 0)
        elif name == 'rotate':
            r = math.radians(v[0]); c, s = math.cos(r), math.sin(r)
            if len(v) == 3:                       # rotate(a cx cy)
                cx, cy = v[1], v[2]
                N = (c, s, -s, c, cx - cx * c + cy * s, cy - cx * s - cy * c)
            else:
                N = (c, s, -s, c, 0, 0)
        elif name == 'scale':
            sx = v[0]; sy = v[1] if len(v) > 1 else sx
            N = (sx, 0, 0, sy, 0, 0)
        elif name == 'matrix':
            N = tuple(v)
        else:
            raise SystemExit(f'normalize-svg: unhandled transform {name}()')
        a1, b1, c1, d1, e1, f1 = M
        a2, b2, c2, d2, e2, f2 = N
        M = (a1 * a2 + c1 * b2, b1 * a2 + d1 * b2,
             a1 * c2 + c1 * d2, b1 * c2 + d1 * d2,
             a1 * e2 + c1 * f2 + e1, b1 * e2 + d1 * f2 + f1)
    return M


def apply(M, x, y):
    a, b, c, d, e, f = M
    return (a * x + c * y + e, b * x + d * y + f)


def fmt(n):
    return f'{n:.2f}'.rstrip('0').rstrip('.')


def bake_rect(m):
    attrs = m.group(0)
    t = re.search(r'\s*transform="([^"]*)"', attrs)
    if not t:
        return attrs
    g = lambda k: float(re.search(rf'\b{k}="([-\d.eE]+)"', attrs).group(1))
    x, y, w, h = g('x'), g('y'), g('width'), g('height')
    M = parse_transform(t.group(1))
    pts = [apply(M, px, py) for px, py in
           ((x, y), (x + w, y), (x + w, y + h), (x, y + h))]
    xs = [p[0] for p in pts]; ys = [p[1] for p in pts]
    X, Y, W, H = min(xs), min(ys), max(xs) - min(xs), max(ys) - min(ys)
    # axis-aligned within tolerance? -> plain rect. otherwise -> polygon path.
    skew = max(min(abs(p[0] - X), abs(p[0] - (X + W))) for p in pts)
    base = attrs[:t.start()] + attrs[t.end():]
    if skew <= TOL:
        for k, v in (('x', X), ('y', Y), ('width', W), ('height', H)):
            base = re.sub(rf'\b{k}="[-\d.eE]+"', f'{k}="{fmt(v)}"', base)
        return base
    d = 'M' + 'L'.join(f'{fmt(px)},{fmt(py)}' for px, py in pts) + 'Z'
    cls = re.search(r'\sclass="[^"]*"', base)
    return f'<path{cls.group(0) if cls else ""} d="{d}"/>'


def main():
    args = [a for a in sys.argv[1:] if not a.startswith('--')]
    check = '--check' in sys.argv
    if not args:
        raise SystemExit(__doc__)
    path = args[0]
    src = open(path).read()
    if check:
        n = len(re.findall(r'transform="', src))
        print(f'{path}: {n} transform(s)')
        sys.exit(1 if n else 0)
    out = re.sub(r'<rect\b[^>]*transform="[^"]*"[^>]*/>', bake_rect, src)
    remaining = re.findall(r'transform="([^"]*)"', out)
    if remaining:
        print(f'warning: {len(remaining)} transform(s) left on non-rect elements: {remaining}')
    if out == src:
        print(f'{path}: no transforms to bake')
        return
    shutil.copy(path, path + '.orig')
    open(path, 'w').write(out)
    print(f'{path}: baked {len(re.findall(r"transform=", src))} transform(s); '
          f'original saved as {path}.orig')


if __name__ == '__main__':
    main()
