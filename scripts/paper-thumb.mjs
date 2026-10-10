#!/usr/bin/env node
/**
 * Make a publication thumbnail: public/images/papers/<key>.webp, at most 720 px on the
 * long side. The publications page shows it when the overlay entry says
 * `image: "papers/<key>.webp"`.
 *
 * Usage: node scripts/paper-thumb.mjs <key> <figure.png|jpg|pdf-page.png>
 *
 * Crop to the figure panel you want first; the page shows thumbnails at 4:3 with
 * object-fit: cover, so a centred subject survives.
 */
import { existsSync, mkdirSync } from 'node:fs';
import sharp from 'sharp';

const [key, src] = process.argv.slice(2);
if (!key || !src || !/^[a-z0-9-]+$/.test(key)) {
  console.error('usage: node scripts/paper-thumb.mjs <key> <image>   (key like rose-2024)');
  process.exit(1);
}
if (!existsSync(src)) {
  console.error(`no such file: ${src}`);
  process.exit(1);
}
mkdirSync('public/images/papers', { recursive: true });
const out = `public/images/papers/${key}.webp`;
const info = await sharp(src).rotate().resize(720, 720, { fit: 'inside', withoutEnlargement: true }).webp({ quality: 80 }).toFile(out);
console.log(`${out}  ${info.width}x${info.height}  ${(info.size / 1024).toFixed(0)} KB`);
console.log(`overlay:  image: "papers/${key}.webp"`);
