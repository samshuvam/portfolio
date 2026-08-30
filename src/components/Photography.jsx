import React, { useMemo, useState } from 'react';
import { Aperture, Camera, FolderPlus } from 'lucide-react';

// Add images to this folder; Vite picks up every aspect ratio at build time.
const photos = import.meta.glob('../assets/photography/*.{jpg,jpeg,png,webp,avif}', { eager: true, query: '?url', import: 'default' });

export default function Photography() {
  const items = useMemo(() => Object.entries(photos).map(([path, src], index) => ({ src, index, name: path.split('/').pop() })), []);
  const [hovered, setHovered] = useState(null);
  return <section id="photography" className="relative py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
    <div className="mb-8 flex items-center gap-3"><div className="inline-flex items-center gap-2 text-xs font-mono text-amber-300"><Aperture className="w-4 h-4" /> VISUAL FIELD NOTES</div><span className="h-px flex-1 bg-gradient-to-r from-amber-300/40 to-transparent" /></div>
    <h2 className="text-3xl sm:text-4xl font-bold text-white mb-8">Frames from the <span className="text-amber-300">in-between.</span></h2>
    {items.length ? <div className="photo-masonry">{items.map((photo) => <figure key={photo.src} onMouseEnter={() => setHovered(photo.index)} onMouseLeave={() => setHovered(null)} className={`photo-frame ${hovered === photo.index ? 'is-hovered' : ''}`} style={{ '--tilt': `${photo.index % 3 === 0 ? '-.35' : photo.index % 3 === 1 ? '.25' : '0'}deg` }}><img src={photo.src} alt={photo.name?.replace(/\.[^.]+$/, '').replace(/[-_]/g, ' ')} loading="lazy" /><span className="photo-sheen" aria-hidden="true" /></figure>)}</div> : <div className="glass-card border-dashed rounded-2xl p-10 text-center"><Camera className="w-8 h-8 text-amber-300 mx-auto mb-3" /><p className="text-white font-medium">Your gallery is ready</p><p className="text-sm text-slate-400 max-w-lg mx-auto mt-2">Drop photos into <code className="text-cyan-300">src/assets/photography</code>. Their original proportions will be preserved automatically.</p><FolderPlus className="w-4 h-4 text-cyan-300 mx-auto mt-4" /></div>}
  </section>;
}
