// Generates optimized photo variants, a manifest with EXIF "shot on" data,
// and the hand-drawn "sketch plates" used by the sketchbook.
//
// Drop new photos into src/assets/photography and they appear on the site.
// Runs automatically before `npm run dev` and `npm run build`; unchanged
// photos are skipped through a small cache.

import { readdir, stat, mkdir, readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import exifr from 'exifr';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SRC_DIR = path.join(root, 'src/assets/photography');
const PORTRAIT = path.join(root, 'myimage/me.jpg');
const OUT_DIR = path.join(root, 'public/photos');
const MANIFEST = path.join(root, 'src/data/photos.generated.json');
const CACHE = path.join(root, 'node_modules/.cache/photos-cache.json');
const WIDTHS = [480, 960, 1600, 2560];
const TEX_WIDTH = 1024;
const SCRIPT_VERSION = 6;

// Photos that become pencil-and-wash plates in the Janakpur sketchbook.
// `rotate` straightens shots that were taken at an angle.
const SKETCHES = {
  'IMG_20260527_185937_774': { rotate: -90 },
  'IMG_1766 (1)': {},
  '1000095679': {},
  'IMG_20260816_183220291 (1)': {},
};

const CAMERA_NAMES = {
  'SM-N985F': 'Samsung Galaxy Note20 Ultra',
  'CMF by Nothing Phone 2 Pro': 'CMF Phone 2 Pro',
  'iPhone 16 Pro Max': 'iPhone 16 Pro Max',
};

const slugify = (name) => name.toLowerCase().replace(/\.[^.]+$/, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

async function loadCache() {
  try { return JSON.parse(await readFile(CACHE, 'utf8')); } catch { return {}; }
}

async function sketchPlate(input, out, opts) {
  const W = 1200;
  let base = sharp(input).rotate();
  if (opts.rotate) base = base.rotate(opts.rotate);
  const { data: rgb, info } = await base.resize({ width: W, withoutEnlargement: true }).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width, height } = info;
  const n = width * height;
  const gray = new Float32Array(n);
  for (let i = 0; i < n; i++) gray[i] = 0.299 * rgb[i * 3] + 0.587 * rgb[i * 3 + 1] + 0.114 * rgb[i * 3 + 2];

  const grayBuf = Buffer.from(Uint8Array.from(gray, (v) => 255 - v));
  // Keep every intermediate single-channel / three-channel so indices line up.
  const invBlur = await sharp(grayBuf, { raw: { width, height, channels: 1 } }).blur(6).extractChannel(0).raw().toBuffer();
  const wash = await sharp(rgb, { raw: { width, height, channels: 3 } }).blur(14).modulate({ saturation: 0.9, brightness: 1.12 }).removeAlpha().raw().toBuffer();
  if (invBlur.length !== n || wash.length !== n * 3) throw new Error(`sketch buffers misaligned for ${input}`);

  // Lokta-paper tone and a little grain so it reads as drawn, not filtered.
  const paper = [243, 238, 228];
  const outBuf = Buffer.alloc(n * 3);
  let seed = 7;
  const rand = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  for (let i = 0; i < n; i++) {
    const g = gray[i];
    const b = invBlur[i];
    let line = Math.min(255, (g * 255) / Math.max(1, 255 - b)); // colour dodge
    line = Math.pow(line / 255, 1.7); // pencil pressure
    // Watercolour wash pools in darker areas and fades out in highlights.
    const shade = 1 - g / 255;
    const washAmt = 0.18 + 0.42 * shade;
    const grain = 0.955 + rand() * 0.06;
    for (let c = 0; c < 3; c++) {
      const tint = wash[i * 3 + c] / 255;
      const washed = paper[c] * (1 - washAmt + washAmt * tint * 1.05);
      outBuf[i * 3 + c] = Math.max(0, Math.min(255, washed * (0.12 + 0.88 * line) * grain));
    }
  }
  await sharp(outBuf, { raw: { width, height, channels: 3 } }).webp({ quality: 80 }).toFile(out);
  return { width, height };
}

async function processOne(file, srcPath, opts = {}) {
  const id = opts.id || slugify(file);
  const meta = await sharp(srcPath).rotate().metadata();
  // .rotate() keeps reported dimensions pre-rotation; swap for 90/270 orientations.
  const swap = meta.orientation && meta.orientation >= 5;
  const w = swap ? meta.height : meta.width;
  const h = swap ? meta.width : meta.height;

  // Never upscale: small exports only get the sizes they can honestly fill.
  const targets = [...new Set(WIDTHS.map((x) => Math.min(x, w)))];
  const variants = [];
  for (const width of targets) {
    const outName = `${id}-${width}.webp`;
    await sharp(srcPath).rotate().resize({ width, withoutEnlargement: true }).webp({ quality: 92 }).toFile(path.join(OUT_DIR, outName));
    variants.push({ src: `photos/${outName}`, w: width });
  }
  const src = (variants.find((v) => v.w >= 960) || variants[variants.length - 1]).src;
  const texName = `${id}-tex.webp`;
  await sharp(srcPath).rotate().resize({ width: Math.min(TEX_WIDTH, w), withoutEnlargement: true }).webp({ quality: 90 }).toFile(path.join(OUT_DIR, texName));

  const tiny = await sharp(srcPath).rotate().resize({ width: 20 }).blur(1.2).webp({ quality: 40 }).toBuffer();
  const { dominant } = await sharp(srcPath).stats();
  const color = `#${[dominant.r, dominant.g, dominant.b].map((v) => v.toString(16).padStart(2, '0')).join('')}`;

  let camera = null;
  let taken = null;
  try {
    const exif = await exifr.parse(srcPath, ['Make', 'Model', 'DateTimeOriginal', 'CreateDate', 'ModifyDate']);
    if (exif?.Model) camera = CAMERA_NAMES[exif.Model] || exif.Model;
    const d = exif?.DateTimeOriginal || exif?.CreateDate;
    if (d instanceof Date && !Number.isNaN(d.getTime())) taken = d.toISOString().slice(0, 10);
  } catch {
    // Many exported photos carry no EXIF; that is fine.
  }

  let sketch = null;
  const base = file.replace(/\.[^.]+$/, '');
  if (SKETCHES[base]) {
    const sketchName = `${id}-sketch.webp`;
    const photoName = `${id}-plate.webp`;
    const dims = await sketchPlate(srcPath, path.join(OUT_DIR, sketchName), SKETCHES[base]);
    let plate = sharp(srcPath).rotate();
    if (SKETCHES[base].rotate) plate = plate.rotate(SKETCHES[base].rotate);
    await plate.resize({ width: dims.width }).webp({ quality: 82 }).toFile(path.join(OUT_DIR, photoName));
    sketch = { src: `photos/${sketchName}`, photo: `photos/${photoName}`, w: dims.width, h: dims.height };
  }

  return {
    id,
    file,
    w,
    h,
    ratio: +(w / h).toFixed(4),
    color,
    placeholder: `data:image/webp;base64,${tiny.toString('base64')}`,
    src,
    srcset: variants,
    tex: `photos/${texName}`,
    camera,
    taken,
    sketch,
  };
}

async function main() {
  await mkdir(OUT_DIR, { recursive: true });
  await mkdir(path.dirname(CACHE), { recursive: true });
  const cache = await loadCache();
  const nextCache = { version: SCRIPT_VERSION, entries: {} };
  const files = (await readdir(SRC_DIR)).filter((f) => /\.(jpe?g|png|webp|avif)$/i.test(f)).sort();

  const jobs = files.map((file) => ({ file, srcPath: path.join(SRC_DIR, file), opts: {} }));
  if (existsSync(PORTRAIT)) jobs.push({ file: 'me.jpg', srcPath: PORTRAIT, opts: { id: 'portrait' } });

  const photos = [];
  let portrait = null;
  let done = 0;
  for (const job of jobs) {
    const s = await stat(job.srcPath);
    const key = `${job.file}:${s.size}:${Math.round(s.mtimeMs)}`;
    const cached = cache.version === SCRIPT_VERSION ? cache.entries?.[job.file] : null;
    let entry;
    if (cached && cached.key === key && existsSync(path.join(root, 'public', cached.entry.src))) {
      entry = cached.entry;
    } else {
      entry = await processOne(job.file, job.srcPath, job.opts);
      done++;
    }
    nextCache.entries[job.file] = { key, entry };
    if (job.opts.id === 'portrait') portrait = entry;
    else photos.push(entry);
  }

  await writeFile(MANIFEST, JSON.stringify({ portrait, photos }, null, 0));
  await writeFile(CACHE, JSON.stringify(nextCache));
  console.log(`[photos] ${photos.length} photos${portrait ? ' + portrait' : ''} ready (${done} processed, ${jobs.length - done} cached)`);
}

main().catch((err) => {
  console.error('[photos] failed:', err);
  process.exit(1);
});
