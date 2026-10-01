import manifest from '../data/photos.generated.json';
import { photoCaptions } from '../data/misc';

// Photos come from scripts/build-photos.mjs (optimised WebP + EXIF).
// Paths in the manifest are relative to the site root.
const base = import.meta.env.BASE_URL || '/';
const url = (p) => `${base}${p}`;

const withUrls = (p) =>
  p && {
    ...p,
    src: url(p.src),
    tex: url(p.tex),
    srcset: p.srcset.map((v) => ({ ...v, src: url(v.src) })),
    srcsetAttr: p.srcset.map((v) => `${url(v.src)} ${v.w}w`).join(', '),
    caption: photoCaptions[p.id] || null,
    sketch: p.sketch ? { ...p.sketch, src: url(p.sketch.src), photo: url(p.sketch.photo) } : null,
  };

export const photos = (manifest.photos || []).map(withUrls);
export const portrait = withUrls(manifest.portrait);
const byId = new Map(photos.map((p) => [p.id, p]));
export const photoById = (id) => byId.get(id);

export const cameraCounts = photos.reduce((acc, p) => {
  if (p.camera) acc[p.camera] = (acc[p.camera] || 0) + 1;
  return acc;
}, {});
