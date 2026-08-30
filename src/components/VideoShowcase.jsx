import React, { useState } from 'react';
import { Play, Video, Plus, ExternalLink } from 'lucide-react';
import { videoPlaylist } from '../data/portfolioData';

function youtubeId(url) {
  try {
    const parsed = new URL(url);
    return parsed.hostname.includes('youtu.be') ? parsed.pathname.slice(1) : parsed.searchParams.get('v');
  } catch { return null; }
}

export default function VideoShowcase({ playSound }) {
  const [active, setActive] = useState(0);
  const video = videoPlaylist[active];
  const id = video && youtubeId(video.url);

  return (
    <section id="watch" className="relative py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      <div className="glass-panel rounded-3xl p-5 sm:p-8 border border-cyan-500/20 overflow-hidden">
        <div className="grid lg:grid-cols-[1.4fr_.6fr] gap-7 items-center">
          <div>
            <div className="inline-flex items-center gap-2 text-cyan-300 text-xs font-mono mb-3"><Video className="w-4 h-4" /> WATCH / LEARN</div>
            <h2 className="text-2xl sm:text-3xl font-bold text-white">Federated learning, explained from the build bench.</h2>
            <p className="text-slate-300 mt-3 leading-relaxed text-sm sm:text-base">I use privacy-aware AI patterns to explore how systems can learn across environments without treating sensitive raw data as a central asset.</p>
            <div className="mt-5 aspect-video rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 relative">
              {id ? (
                <iframe className="w-full h-full" src={`https://www.youtube-nocookie.com/embed/${id}?autoplay=0&loop=1&playlist=${id}&rel=0`} title={video.title} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6 bg-[radial-gradient(circle_at_center,rgba(6,182,212,.16),transparent_55%)]">
                  <div className="w-14 h-14 rounded-full bg-cyan-400/10 border border-cyan-300/30 flex items-center justify-center mb-3"><Play className="w-6 h-6 text-cyan-300 fill-cyan-300" /></div>
                  <p className="text-white font-semibold">Your Federated Learning video goes here</p>
                  <p className="text-xs text-slate-400 max-w-sm mt-1">Paste its YouTube link into <code className="text-cyan-300">videoPlaylist</code> in portfolioData.js. The player will loop it and add future videos as a playlist.</p>
                </div>
              )}
            </div>
          </div>
          <aside className="rounded-2xl bg-slate-950/60 border border-slate-800 p-4 sm:p-5">
            <p className="text-xs font-mono tracking-wider text-slate-400 mb-3">VIDEO LIBRARY</p>
            {videoPlaylist.length ? videoPlaylist.map((item, index) => (
              <button key={item.id} onClick={() => { setActive(index); playSound?.('click'); }} className={`w-full text-left rounded-xl p-3 mb-2 transition ${active === index ? 'bg-cyan-500/15 border border-cyan-400/30' : 'hover:bg-white/5 border border-transparent'}`}>
                <span className="text-sm font-medium text-white block">{item.title}</span><span className="text-xs text-slate-400">{item.description}</span>
              </button>
            )) : <div className="rounded-xl border border-dashed border-slate-700 p-4 text-sm text-slate-400"><Plus className="w-4 h-4 text-cyan-400 mb-2" />Playlist-ready: add one or many YouTube links when you are ready.</div>}
            <a href="#glossary" className="mt-4 flex items-center gap-2 text-xs text-cyan-300 hover:text-white"><ExternalLink className="w-3.5 h-3.5" /> New to the terms? Read the plain-English glossary.</a>
          </aside>
        </div>
      </div>
    </section>
  );
}
