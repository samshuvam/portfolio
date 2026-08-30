import React, { useState } from 'react';
import { Ghost, Send, Check, LockKeyhole } from 'lucide-react';
import { personalInfo } from '../data/portfolioData';

export default function AnonymousInbox() {
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState('');
  const submit = async (event) => {
    event.preventDefault();
    setStatus('sending'); setError('');
    try {
      const payload = new FormData();
      payload.append('message', message);
      payload.append('_subject', 'Anonymous note from shuvamsingh.com.np');
      payload.append('_template', 'table');
      payload.append('_captcha', 'false');
      const response = await fetch(`https://formsubmit.co/ajax/${personalInfo.email}`, { method: 'POST', body: payload, headers: { Accept: 'application/json' } });
      if (!response.ok) throw new Error('Unable to send');
      setMessage(''); setStatus('sent');
    } catch { setStatus('error'); setError('Could not send right now. Please try again or use the regular inquiry form.'); }
  };
  return <section className="relative py-12 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto"><div className="glass-panel rounded-3xl p-6 sm:p-8 border border-purple-500/20"><div className="flex items-center gap-3 mb-2"><Ghost className="w-5 h-5 text-purple-300" /><h2 className="text-xl font-bold text-white">Anonymous tab</h2></div><p className="text-sm text-slate-400 mb-5">A quiet channel for feedback, ideas, or a hello. No name or email is collected.</p>{status === 'sent' ? <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-5 text-center"><Check className="w-6 h-6 text-emerald-300 mx-auto mb-2" /><p className="text-white font-medium">Message delivered to Shuvam’s inbox.</p><button onClick={() => setStatus('idle')} className="text-xs text-cyan-300 mt-3">Send another</button></div> : <form onSubmit={submit}><textarea required value={message} onChange={(event) => setMessage(event.target.value)} rows={4} maxLength={2000} placeholder="Write anonymously…" className="w-full px-4 py-3 rounded-xl bg-slate-900/90 border border-slate-800 focus:border-purple-400 focus:ring-1 focus:ring-purple-400 outline-none text-slate-200 text-sm resize-none" /><div className="mt-3 flex flex-wrap items-center justify-between gap-3"><span className="text-xs text-slate-500 flex items-center gap-1"><LockKeyhole className="w-3.5 h-3.5" /> No identifying fields</span><button disabled={status === 'sending'} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-purple-500/20 border border-purple-400/30 text-purple-100 text-sm font-semibold hover:bg-purple-500/30">{status === 'sending' ? 'Sending…' : 'Send anonymously'} <Send className="w-4 h-4" /></button></div>{status === 'error' && <p className="text-xs text-rose-300 mt-3" role="alert">{error}</p>}</form>}</div></section>;
}
