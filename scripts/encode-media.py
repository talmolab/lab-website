#!/usr/bin/env python3
"""Web encodes for public/media/ and the registry in src/data/media.yaml.

    python3 scripts/encode-media.py [--source <redux scratch folder>]

The source footage is not in this repo (3 GB). It lives in the lab-website repo's gitignored
scratch/2026-10-03-redesign-redux/, whose catalogue/inventory.json maps each catalogue ID
(SF22, TV08, ...) to a file; CATALOGUE.md there describes every clip. Encodes already made for
the design canvas (scratch/.../web/<ID>.mp4) are reused when their trim matches.

Every clip: H.264 High, CRF 26, no audio, at most 30 fps, faststart, plus a first-frame poster
(the poster matches frame 0, so a loop never jumps). Keypoint-overlay pairs are encoded at the
same size and timing so they can be stacked with mix-blend-mode.
"""
import argparse, ast, json, os, shutil, subprocess
from concurrent.futures import ThreadPoolExecutor

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
ap = argparse.ArgumentParser()
ap.add_argument("--source", default=os.path.expanduser("~/code/lab-website/scratch/2026-10-03-redesign-redux"))
args = ap.parse_args()
SRC = args.source
inv = {i["id"]: i for i in json.load(open(os.path.join(SRC, "catalogue", "inventory.json")))}
canvas_meta = json.load(open(os.path.join(SRC, "web", "meta.json")))
# The trims used for the design canvas encodes, read from that script rather than copied.
_tree = ast.parse(open(os.path.join(SRC, "scripts", "web_encode.py")).read())
canvas_trims = next(ast.literal_eval(n.value) for n in _tree.body
                    if isinstance(n, ast.Assign) and getattr(n.targets[0], "id", "") == "CLIPS")
canvas_trims = {k: tuple(v) for k, v in canvas_trims.items()}
canvas_trims["SF02"] = (0, None, 640)  # re-encoded at 640 to match its keypoint layer

OUT = os.path.join(ROOT, "public", "media")
os.makedirs(OUT, exist_ok=True)

# slug: (catalogue id, start s, duration s or None, width, thread, tool, title, caption)
# thread: an id in src/content/areas (validated as a reference)
CLIPS = {
    # -- pose estimation and tracking
    "flies-trails": ("PS001", 2, 10, 1280, "computational-ethology", "SLEAP", "Two flies, pose trails",
                     "Two interacting flies tracked with SLEAP, each pose leaving a trail. Recorded at 60 fps."),
    "fly-wake": ("TV26", 0, None, 1280, "computational-ethology", "SLEAP", "One fly, pose wake",
                 "A single fly walking across the arena, its tracked skeleton drawn every few frames."),
    "sleap-flies": ("SF13", 0, None, 1280, "computational-ethology", "SLEAP", "How SLEAP works: flies",
                    "The frame, the network's intermediate outputs, then identity tracks."),
    "sleap-mice": ("SF14", 0, None, 1280, "computational-ethology", "SLEAP", "How SLEAP works: mice",
                   "The same pipeline on four mice in an open field."),
    "bees": ("PS002", 0, 10, 720, "computational-ethology", "SLEAP", "Bees", "Two bees in a honeycomb-patterned dish."),
    "two-flies": ("PS004", 0, 10, 720, "computational-ethology", "SLEAP", "Two flies", "Two flies, tracked through contact."),
    "fly-32": ("PS005", 0, 10, 720, "computational-ethology", "SLEAP", "One fly, 32 keypoints", "A single fly with a 32-node skeleton."),
    "gerbils": ("PS006", 0, 10, 720, "computational-ethology", "SLEAP", "Gerbils", "Gerbils in a home cage."),
    "mice-homecage": ("PS007", 0, 10, 720, "computational-ethology", "SLEAP", "Two mice, home cage", "Two mice in a home cage."),
    "mice-openfield": ("PS008", 0, 10, 720, "computational-ethology", "SLEAP", "Mice, open field", "Mice in an open field, skeletons only."),
    "five-mice": ("TV21", 0, 12, 720, "computational-ethology", "SLEAP", "Five mice, five identities",
                  "Five mice in an open field, each kept as one identity."),
    "many-flies": ("TV24", 0, 12, 640, "computational-ethology", "SLEAP", "Many flies", "About ten flies, each tracked in its own colour."),
    "giraffes": ("TV27", 0, None, 638, "computational-ethology", "SLEAP", "Giraffes necking", "Two giraffes fighting, keypoints on."),
    "dreem-arena": ("SF15", 0, None, 1280, "computational-ethology", "DREEM", "Many animals, one identity each",
                    "DREEM links detections into identities across a whole video."),
    "dreem-homecage": ("PS045", 0, 12, 1280, "computational-ethology", "DREEM", "Tracks through time",
                       "DREEM tracking mice in a home cage, beside the tracks plotted through time."),
    "dreem-cells": ("PS046", 0, 12, 1280, "computational-ethology", "DREEM", "Cells, not animals",
                    "The same tracker following cells in microscopy."),
    "luc3d-flythrough": ("SF16", 0, None, 1280, "computational-ethology", "LUC3D", "Multi-view 3D",
                         "From a 3D reconstruction into each camera's view and back."),
    "luc3d-gui": ("PS048", 20, 12, 1280, "computational-ethology", "LUC3D", "The LUC3D annotation GUI",
                  "Five camera views, labelled skeletons and triangulation, in the browser."),
    "mice-3d": ("TV18", 0, 12, 960, "computational-ethology", "3D pose", "Four mice in 3D",
                "Four mice as 3D skeletons in a reconstructed arena, social contacts marked."),
    "pair-3d": ("SF17", 0, None, 1280, "computational-ethology", "3D pose", "A social pair in 3D", "Two animals as 3D skeletons."),
    "two-cam": ("TV17", 0, 12, 1280, "computational-ethology", "3D pose", "Two cameras, one 3D pose",
                "Two camera views with 2D poses beside a render of the triangulated pair."),
    "skeletons": ("SF01", 0, 12, 800, "computational-ethology", "3D pose", "Two skeletons", "Two 3D skeletons circling each other."),
    # keypoint-overlay pairs (raw + keypoints on black, same size and timing)
    "mouse-gait": ("SF06", 0, 12, 960, "computational-ethology", "SLEAP", "Mouse locomotion", "Mouse locomotion with painted paws."),
    "mouse-gait-kp": ("SF07", 0, 12, 960, "computational-ethology", "SLEAP", "Mouse locomotion, keypoints", "Keypoints only."),
    "fly-grooming": ("SF03", 0, None, 310, "computational-ethology", "SLEAP", "Fly grooming", "Fly head grooming."),
    "fly-grooming-kp": ("SF04", 0, None, 310, "computational-ethology", "SLEAP", "Fly grooming, keypoints", "Keypoints only."),
    "bees-raw": ("TV20", 0, 12, 720, "computational-ethology", "SLEAP", "Two bees", "Two bees, untracked."),
    "bees-tracked": ("TV19", 0, 12, 720, "computational-ethology", "SLEAP", "Two bees, tracked", "Identity kept through contact."),
    "giraffe": ("SF02", 0, None, 640, "computational-ethology", "SLEAP", "Giraffe", "A reticulated giraffe walking, Mpala."),
    "giraffe-kp": ("SF05", 0, None, 640, "computational-ethology", "SLEAP", "Giraffe, keypoints", "Keypoints only."),
    # -- phenotyping at scale
    "homecage-neon": ("PS056", 5, 10, 1280, "phenotyping", "Home-cage monitoring", "Three mice, round the clock",
                      "Three mice in a home cage, tracked continuously. Recorded at 60 fps."),
    "cages-zoom": ("TV08", 0, None, 1600, "phenotyping", "Home-cage monitoring", "From one cage to hundreds",
                   "The same measurement, run across a wall of home cages."),
    "timelapse": ("SF19", 0, 12, 960, "phenotyping", "Home-cage monitoring", "Days in a home cage",
                  "A home-cage timelapse: days pass, bedding changes, the mice stay tracked."),
    "motifs": ("TV07", 0, None, 1600, "phenotyping", "Behavioral motifs", "Behavioral motifs",
               "Dozens of short clips grouped into recurring behaviors."),
    "gerbil-family": ("TV23", 0, None, 800, "phenotyping", "Home-cage monitoring", "A gerbil family",
                      "A gerbil family in its home cage, every animal tracked."),
    "space-mouse": ("SF18", 0, 12, 1280, "phenotyping", "Spaceflight", "Mouse in a spaceflight habitat",
                    "Trajectory and centripetal acceleration of a mouse in a spaceflight habitat."),
    # -- complex morphology
    "rice-roots": ("TV14", 0, None, 540, "complex-morphology", "sleap-roots", "Rice roots", "A rice root system, every root traced."),
    "lateral-roots": ("TV09", 0, None, 1024, "complex-morphology", "sleap-roots", "Lateral roots",
                      "Primary and lateral roots with predicted skeletons."),
    "fibrous-roots": ("TV11", 0, None, 488, "complex-morphology", "sleap-roots", "Fibrous roots", "A fibrous root system, root by root."),
    "soybean": ("TV13", 0, None, 488, "complex-morphology", "sleap-roots", "Soybean", "Soybean root with lateral-root landmarks."),
    "canola": ("TV15", 0, None, 488, "complex-morphology", "sleap-roots", "Canola", "Canola root landmarks."),
    "seedling": ("SF08", 0, None, 288, "complex-morphology", "SLEAP", "Seedling", "A seedling bending to gravity."),
    "seedling-kp": ("SF09", 0, None, 288, "complex-morphology", "SLEAP", "Seedling, keypoints", "Keypoints only."),
    # -- models of the body
    "mimic-montage": ("SF22", 0, None, 1280, "neuro-ai", "MIMIC-MJX", "Recorded motion, simulated bodies",
                      "Rat, fly, worm and stick insect beside their physics-simulated bodies."),
    "ai-vs-real": ("TV02", 0, None, 1280, "neuro-ai", "MIMIC-MJX", "Simulation alone vs with real data",
                   "Virtual rats crossing gaps: trained in simulation alone, and trained on real motion."),
    "mouse-arm": ("PS051", 0, None, 1280, "neuro-ai", "MIMIC-MJX", "Mouse arm",
                  "A recorded reach beside its registered trajectory and the arm model's replay."),
    "rat-model": ("TV06", 0, None, 1280, "neuro-ai", "stac-mjx", "Rat body model",
                  "A rat body model stepping through poses fitted from video."),
    "neural-manifolds": ("SF24", 0, 12, 1280, "neuro-ai", "MIMIC-MJX", "Virtual rat, neural manifolds",
                         "A virtual rat running a gap course, above its network's activity projected in 3D."),
    "emg-arm": ("SF23", 0, 12, 1280, "neuro-ai", "MIMIC-MJX", "Muscles, recorded and simulated",
                "A musculoskeletal mouse arm reaching, beside recorded EMG and simulated muscle activation."),
    "rat-gaps": ("TV05", 0, None, 640, "neuro-ai", "track-mjx", "Leaping gaps", "A virtual rat leaping gaps, one stumble."),
    "skeleton-reach": ("TV03", 0, 10, 640, "neuro-ai", "MIMIC-MJX", "Skeletal reach", "A skeletal mouse model reaching for a target."),
}


def probe(path):
    j = json.loads(subprocess.run(["ffprobe", "-v", "error", "-select_streams", "v:0", "-show_entries",
                                   "stream=width,height:format=duration", "-of", "json", path],
                                  capture_output=True, text=True).stdout)
    s = j["streams"][0]
    return s["width"], s["height"], round(float(j["format"]["duration"]), 2)


def encode(slug):
    cid, start, dur, width = CLIPS[slug][:4]
    out, poster = os.path.join(OUT, f"{slug}.mp4"), os.path.join(OUT, f"{slug}.jpg")
    reuse = os.path.join(SRC, "web", f"{cid}.mp4")
    if canvas_trims.get(cid) == (start, dur, width) and os.path.exists(reuse):
        shutil.copyfile(reuse, out)
    elif not os.path.exists(out):
        it = inv[cid]
        w = min(width, it["width"]) // 2 * 2
        vf = f"scale={w}:-2:flags=lanczos" + (",fps=30" if (it["fps"] or 0) > 31 else "")
        cmd = ["ffmpeg", "-v", "error", "-y", "-ss", str(start)] + (["-t", str(dur)] if dur else [])
        cmd += ["-i", os.path.join(SRC, it["path"]), "-an", "-vf", vf, "-c:v", "libx264", "-preset", "slow",
                "-crf", "26", "-profile:v", "high", "-pix_fmt", "yuv420p", "-movflags", "+faststart", out]
        subprocess.run(cmd, check=True)
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", out, "-frames:v", "1", "-q:v", "4", poster], check=True)
    w, h, d = probe(out)
    return slug, (w, h, d, os.path.getsize(out))


with ThreadPoolExecutor(8) as ex:
    done = dict(ex.map(encode, CLIPS))

lines = ["# Generated by scripts/encode-media.py — edit CLIPS there, not this file.",
         "# source: catalogue ID in scratch/2026-10-03-redesign-redux/CATALOGUE.md (lab-website repo)."]
for slug, (cid, *_rest) in CLIPS.items():
    _, _, _, _, thread, tool, title, caption = CLIPS[slug]
    w, h, d, b = done[slug]
    lines += [f"- id: {slug}", f"  source: {cid}", f"  width: {w}", f"  height: {h}", f"  duration: {d}",
              f"  thread: {thread}", f"  tool: {json.dumps(tool)}", f"  title: {json.dumps(title, ensure_ascii=False)}",
              f"  caption: {json.dumps(caption, ensure_ascii=False)}"]
open(os.path.join(ROOT, "src", "data", "media.yaml"), "w").write("\n".join(lines) + "\n")
tot = sum(v[3] for v in done.values())
print(f"{len(done)} clips, {tot / 1048576:.1f} MB, largest {max(v[3] for v in done.values()) / 1048576:.1f} MB")
