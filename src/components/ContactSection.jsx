import React, { useState } from 'react';
import { Mail, Phone, MapPin, Send, Copy, Check, MessageSquare, FileText, Sparkles, ExternalLink, Camera } from 'lucide-react';
import confetti from 'canvas-confetti';
import { personalInfo } from '../data/portfolioData';

// SVG GitHub icon component
function GitHubIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
      <path d="M9 18c-4.51 2-5-2-7-2" />
    </svg>
  );
}

export default function ContactSection({ playSound }) {
  const [copiedEmail, setCopiedEmail] = useState(false);
  const [copiedPhone, setCopiedPhone] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', message: '' });
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [formStatus, setFormStatus] = useState('idle');
  const [formError, setFormError] = useState('');

  const handleCopyEmail = () => {
    playSound?.('click');
    navigator.clipboard.writeText(personalInfo.email);
    setCopiedEmail(true);
    setTimeout(() => setCopiedEmail(false), 2000);
  };

  const handleCopyPhone = () => {
    playSound?.('click');
    navigator.clipboard.writeText(personalInfo.phone);
    setCopiedPhone(true);
    setTimeout(() => setCopiedPhone(false), 2000);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    playSound?.('synth');
    setFormStatus('sending');
    setFormError('');
    try {
      const payload = new FormData();
      payload.append('name', formData.name);
      payload.append('email', formData.email);
      payload.append('_replyto', formData.email);
      payload.append('message', formData.message);
      payload.append('_subject', `Portfolio inquiry from ${formData.name}`);
      payload.append('_template', 'table');
      payload.append('_captcha', 'false');
      const response = await fetch(`https://formsubmit.co/ajax/${personalInfo.email}`, { method: 'POST', body: payload, headers: { Accept: 'application/json' } });
      if (!response.ok) throw new Error('The email relay rejected the request.');
      setFormSubmitted(true);
      setFormStatus('sent');
      confetti({ particleCount: 80, spread: 70, origin: { y: 0.7 } });
    } catch (error) {
      setFormStatus('error');
      setFormError('The relay could not deliver this yet. Please email directly or try again.');
    }
  };

  return (
    <section id="contact" className="relative py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="text-center max-w-3xl mx-auto mb-16">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-mono mb-3">
          <MessageSquare className="w-3.5 h-3.5" />
          COMMUNICATION NODE
        </div>
        <h2 className="text-3xl sm:text-4xl font-display font-bold text-white mb-4">
          Initiate <span className="bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">Contact & Collaboration</span>
        </h2>
        <p className="text-slate-400 text-sm sm:text-base font-light">
          Whether you're interested in AI research, aerospace systems, ERP engineering, or high-impact opportunities.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 max-w-6xl mx-auto">
        {/* Left Direct Channels Card */}
        <div className="lg:col-span-5 space-y-4">
          {/* Primary Email */}
          <div className="glass-card rounded-2xl p-5 border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-3.5">
              <div className="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
                <Mail className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">Primary Email</span>
                <div className="text-sm font-semibold text-white font-mono">{personalInfo.email}</div>
              </div>
            </div>
            <button
              onClick={handleCopyEmail}
              className="p-2 rounded-lg bg-slate-900 border border-slate-700 hover:border-cyan-400 text-slate-400 hover:text-cyan-300 transition-all"
              title="Copy Email"
            >
              {copiedEmail ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>

          {/* Direct Phone / WhatsApp */}
          <div className="glass-card rounded-2xl p-5 border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-3.5">
              <div className="p-2.5 rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-400">
                <Phone className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">Phone & WhatsApp</span>
                <div className="text-sm font-semibold text-white font-mono">{personalInfo.phone}</div>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <a
                href={personalInfo.whatsapp}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-lg bg-emerald-950/40 border border-emerald-600/40 text-emerald-400 hover:bg-emerald-900/50 transition-all"
                title="Chat on WhatsApp"
              >
                <ExternalLink className="w-4 h-4" />
              </a>
              <button
                onClick={handleCopyPhone}
                className="p-2 rounded-lg bg-slate-900 border border-slate-700 hover:border-purple-400 text-slate-400 hover:text-purple-300 transition-all"
                title="Copy Phone Number"
              >
                {copiedPhone ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* GitHub Profile */}
          <a
            href={personalInfo.github}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => playSound?.('click')}
            className="glass-card rounded-2xl p-5 border-slate-800 flex items-center justify-between group hover:border-cyan-500/40 transition-all block"
          >
            <div className="flex items-center gap-3.5">
              <div className="p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white group-hover:text-cyan-400 transition-colors">
                <GitHubIcon className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">GitHub Profile</span>
                <div className="text-sm font-semibold text-white font-mono">github.com/{personalInfo.githubUsername}</div>
              </div>
            </div>
            <ExternalLink className="w-4 h-4 text-slate-500 group-hover:text-cyan-400 transition-colors" />
          </a>

          <a href="https://www.instagram.com/sam.shuvam" target="_blank" rel="noopener noreferrer" onClick={() => playSound?.('click')} className="glass-card rounded-2xl p-5 border-slate-800 flex items-center justify-between group hover:border-pink-500/40 transition-all block">
            <div className="flex items-center gap-3.5"><div className="p-2.5 rounded-xl bg-pink-500/10 border border-pink-500/30 text-pink-300"><Camera className="w-5 h-5" /></div><div><span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">Instagram</span><div className="text-sm font-semibold text-white font-mono">@sam.shuvam</div></div></div><ExternalLink className="w-4 h-4 text-slate-500 group-hover:text-pink-300 transition-colors" />
          </a>

          {/* Location & Domicile */}
          <div className="glass-card rounded-2xl p-5 border-slate-800">
            <div className="flex items-center gap-3.5 mb-2">
              <div className="p-2.5 rounded-xl bg-blue-500/10 border border-blue-500/30 text-blue-400">
                <MapPin className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">Location</span>
                <div className="text-sm font-semibold text-white">{personalInfo.location}</div>
              </div>
            </div>
            <p className="text-xs text-slate-400 pl-12 font-mono">
              
            </p>
          </div>

          {/* Instant CV PDF Download */}
          <a
            href="/CV.pdf"
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => playSound?.('click')}
            className="w-full flex items-center justify-center gap-2 p-4 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-sm shadow-lg shadow-cyan-500/20 hover:shadow-cyan-400/35 transition-all"
          >
            <FileText className="w-4 h-4" />
            <span>Download Official CV / Resume (PDF)</span>
          </a>
        </div>

        {/* Right Interactive Form */}
        <div className="lg:col-span-7">
          <div className="glass-panel-glow bg-[#0d0f18] rounded-3xl p-6 sm:p-8 border border-cyan-500/30">
            <h3 className="text-xl font-display font-bold text-white mb-2 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-cyan-400" />
              <span>Send Direct Inquiry</span>
            </h3>
            <p className="text-xs text-slate-400 font-mono mb-6">
              Secure relay → <strong className="text-slate-300">{personalInfo.email}</strong> · your email is used only for replying
            </p>

            {formSubmitted ? (
              <div className="p-6 rounded-2xl bg-emerald-950/30 border border-emerald-500/40 text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
                  <Check className="w-6 h-6" />
                </div>
                <h4 className="text-lg font-bold text-white font-display">Inquiry Prepared!</h4>
                <p className="text-xs text-slate-300 font-light">
                  Your email client has been triggered. You can also reach out directly via WhatsApp or phone at <strong className="text-cyan-300">{personalInfo.phone}</strong>.
                </p>
                <button
                  onClick={() => setFormSubmitted(false)}
                  className="px-4 py-2 rounded-xl text-xs font-mono bg-slate-900 text-slate-300 hover:text-white border border-slate-700"
                >
                  Send Another Message
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-mono text-slate-300 mb-1.5">Your Name</label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Miss Kalyani"
                      className="w-full px-4 py-3 rounded-xl bg-slate-900/90 border border-slate-800 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 outline-none text-slate-200 text-sm font-mono placeholder:text-slate-600 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-mono text-slate-300 mb-1.5">Your Email</label>
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="Shuvams@kalyani.org"
                      className="w-full px-4 py-3 rounded-xl bg-slate-900/90 border border-slate-800 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 outline-none text-slate-200 text-sm font-mono placeholder:text-slate-600 transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-mono text-slate-300 mb-1.5">Project / Inquiry Details</label>
                  <textarea
                    rows={5}
                    required
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    placeholder="Describe your research inquiry, technical discussion, or engineering project..."
                    className="w-full px-4 py-3 rounded-xl bg-slate-900/90 border border-slate-800 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 outline-none text-slate-200 text-sm font-mono placeholder:text-slate-600 transition-all resize-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={formStatus === 'sending'}
                  className="w-full py-3.5 rounded-xl bg-gradient-to-r from-cyan-500 via-blue-600 to-purple-600 hover:from-cyan-400 hover:to-purple-500 text-slate-950 font-bold text-sm tracking-wide shadow-lg shadow-cyan-500/20 hover:shadow-cyan-500/35 transition-all flex items-center justify-center gap-2"
                >
                  <Send className="w-4 h-4" />
                  <span>{formStatus === 'sending' ? 'Sending securely…' : 'Send to Shuvam’s inbox'}</span>
                </button>
                {formStatus === 'error' && <p className="text-xs text-rose-300" role="alert">{formError}</p>}
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
