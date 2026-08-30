import React, { useMemo, useState } from 'react';
import { Aperture, Camera, FolderPlus, ChevronDown, ChevronUp } from 'lucide-react';

// Add images to this folder; Vite picks up every aspect ratio at build time.
const photos = import.meta.glob('../assets/photography/*.{jpg,jpeg,png,webp,avif}', { eager: true, query: '?url', import: 'default' });
const ROW_SIZE = 4;

export default function Photography() {
  const items = useMemo(() => Object.entries(photos).map(([path, src], index) => ({ src, index, name: path.split('/').pop() })), []);
  const [visibleCount, setVisibleCount] = useState(ROW_SIZE);
  const [hovered, setHovered] = useState(null);
  const visibleItems = items.slice(0, visibleCount);
  const isExpanded = visibleCount > ROW_SIZE;
  const hasMore = visibleCount < items.length;

  const loadNextRow = () => setVisibleCount((count) => Math.min(count + ROW_SIZE, items.length));
  const collapse = () => {
    setVisibleCount(ROW_SIZE);
    document.getElementById('photography')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return <section id="photography" className="relative py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
    <div className="mb-8 flex items-center gap-3"><div className="inline-flex items-center gap-2 text-xs font-mono text-amber-300"><Aperture className="w-4 h-4" /> VISUAL FIELD NOTES</div><span className="h-px flex-1 bg-gradient-to-r from-amber-300/40 to-transparent" /></div>
    <div className="flex flex-wrap items-end justify-between gap-3 mb-8"><h2 className="text-3xl sm:text-4xl font-bold text-white">Frames from the <span className="text-amber-300">in-between.</span></h2>{items.length > ROW_SIZE && <span className="text-xs font-mono text-slate-500">{visibleItems.length} / {items.length} frames</span>}</div>
    {items.length ? <><div className="photo-masonry">{visibleItems.map((photo) => <figure key={photo.src} onMouseEnter={() => setHovered(photo.index)} onMouseLeave={() => setHovered(null)} className={`photo-frame ${hovered === photo.index ? 'is-hovered' : ''}`} style={{ '--tilt': `${photo.index % 3 === 0 ? '-.35' : photo.index % 3 === 1 ? '.25' : '0'}deg` }}><img src={photo.src} alt={photo.name?.replace(/\.[^.]+$/, '').replace(/[-_]/g, ' ')} loading="lazy" /><span className="photo-sheen" aria-hidden="true" /></figure>)}</div><div className="mt-8 flex flex-wrap items-center justify-center gap-3">{hasMore && <button onClick={loadNextRow} className="inline-flex items-center gap-2 rounded-xl border border-amber-300/30 bg-amber-300/10 px-5 py-2.5 text-sm font-semibold text-amber-100 hover:bg-amber-300/20 hover:border-amber-200/60 transition-all">Load next row <ChevronDown className="w-4 h-4" /></button>}{isExpanded && <button onClick={collapse} className="inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-900/70 px-5 py-2.5 text-sm text-slate-300 hover:text-white hover:border-cyan-400/50 transition-all">Collapse gallery <ChevronUp className="w-4 h-4" /></button>}</div></> : <div className="glass-card border-dashed rounded-2xl p-10 text-center"><Camera className="w-8 h-8 text-amber-300 mx-auto mb-3" /><p className="text-white font-medium">Your gallery is ready</p><p className="text-sm text-slate-400 max-w-lg mx-auto mt-2">Drop photos into <code className="text-cyan-300">src/assets/photography</code>. Their original proportions will be preserved automatically.</p><FolderPlus className="w-4 h-4 text-cyan-300 mx-auto mt-4" /></div>}
  </section>;
}
