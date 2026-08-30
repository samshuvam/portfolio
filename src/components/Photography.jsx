import React, { useMemo, useState } from 'react';
import { Aperture, Crosshair, Camera, FolderPlus } from 'lucide-react';

const photos = import.meta.glob('../assets/photography/*.{jpg,jpeg,png,webp,avif}', { eager: true, query: '?url', import: 'default' });

export default function Photography() {
  const items = useMemo(() => Object.entries(photos).map(([path, src], i) => ({ src, name: path.split('/').pop().replace(/\.[^.]+$/, '').replace(/[-_]/g, ' '), i })), []);
  const [hovered, setHovered] = useState(null);
  return <section id="photography" className="relative py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
    <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
      <div><div className="inline-flex gap-2 items-center text-xs font-mono text-amber-300 mb-3"><Aperture className="w-4 h-4" /> VISUAL FIELD NOTES</div><h2 className="text-3xl sm:text-4xl font-bold text-white">Photography through an <span className="text-amber-300">AI lens.</span></h2></div>
      <p className="text-sm text-slate-400 max-w-md">A living gallery. Hover a frame to reveal a playful computer-vision overlay and drone telemetry HUD.</p>
    </div>
    {items.length ? <div className="grid grid-cols-2 md:grid-cols-3 gap-4">{items.map((photo) => <figure key={photo.src} onMouseEnter={() => setHovered(photo.i)} onMouseLeave={() => setHovered(null)} className="group relative aspect-[4/3] rounded-2xl overflow-hidden border border-slate-800 bg-slate-900"><img src={photo.src} alt={photo.name} className="w-full h-full object-cover transition duration-700 group-hover:scale-110" /><figcaption className={`absolute inset-3 transition-opacity ${hovered === photo.i ? 'opacity-100' : 'opacity-0'}`}><div className="absolute inset-0 border border-cyan-300/80"><Crosshair className="absolute -top-2 -left-2 w-5 h-5 text-cyan-300" /><Crosshair className="absolute -bottom-2 -right-2 w-5 h-5 text-cyan-300" /></div><div className="absolute bottom-2 left-2 right-2 p-2 bg-black/70 text-[10px] font-mono text-cyan-200">OBJECT: {photo.name.toUpperCase()}<br />CONFIDENCE: 98.4% · ISO 400 · ALT 134m</div></figcaption></figure>)}</div> : <div className="glass-card border-dashed rounded-2xl p-10 text-center"><Camera className="w-8 h-8 text-amber-300 mx-auto mb-3" /><p className="text-white font-medium">Gallery ready for your images</p><p className="text-sm text-slate-400 max-w-lg mx-auto mt-2">Drop JPG, PNG, WebP, or AVIF files into <code className="text-cyan-300">src/assets/photography</code>. The gallery will collect them automatically on the next build and deployment.</p><FolderPlus className="w-4 h-4 text-cyan-300 mx-auto mt-4" /></div>}
  </section>;
}
