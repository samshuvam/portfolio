import { useEffect, useRef, useState } from 'react';
import { ArrowCounterClockwiseIcon, CameraIcon, DownloadSimpleIcon, LockKeyIcon } from '@phosphor-icons/react';
import { useT } from '../../../i18n';
import dict from '../../../i18n/ui/phone';
import { usePhone, useBack } from '../os';
import { AppShell } from '../parts';
import { sfx } from '../audio';
import '../apps.css';

// A selfie through a Mithila frame. Only starts when the visitor asks;
// everything stays in this browser tab (nothing is uploaded) and the camera
// is released when the app closes or the phone leaves the screen.
const W = 720;
const H = 960;

function frameSvg() {
  const c = { cream: '#f3e3c3', red: '#d6452b', yellow: '#eaa42a', green: '#3e8a4a', ink: '#1e2453' };
  const fish = (x, y, r, fill) =>
    `<g transform="translate(${x} ${y}) rotate(${r})"><path d="M0 0 C22 -26 78 -28 108 -5 L132 -24 L126 0 L132 24 L108 5 C78 28 22 26 0 0 Z" fill="${fill}" stroke="${c.cream}" stroke-width="4"/><circle cx="18" cy="-4" r="6" fill="${c.cream}"/><circle cx="18" cy="-4" r="2.6" fill="${c.ink}"/></g>`;
  const petals = Array.from({ length: 36 }, (_, i) => {
    const horizontal = i < 18;
    const k = i % 18;
    const x = horizontal ? 30 + k * 39 : i < 27 ? 22 : W - 22;
    const y = horizontal ? (k % 2 ? H - 22 : 22) : 90 + ((i % 9) * (H - 180)) / 8;
    return `<circle cx="${x}" cy="${y}" r="7" fill="${k % 3 === 0 ? c.yellow : k % 3 === 1 ? c.red : c.green}" stroke="${c.cream}" stroke-width="2"/>`;
  }).join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">
  <defs><pattern id="h" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><line x1="0" y1="0" x2="0" y2="8" stroke="${c.cream}" stroke-width="2"/></pattern></defs>
  <path fill-rule="evenodd" fill="${c.ink}" d="M0 0 H${W} V${H} H0 Z M44 44 V${H - 44} H${W - 44} V44 Z"/>
  <path fill-rule="evenodd" fill="url(#h)" opacity="0.7" d="M8 8 H${W - 8} V${H - 8} H8 Z M36 36 V${H - 36} H${W - 36} V36 Z"/>
  <rect x="8" y="8" width="${W - 16}" height="${H - 16}" fill="none" stroke="${c.cream}" stroke-width="3"/>
  <rect x="44" y="44" width="${W - 88}" height="${H - 88}" fill="none" stroke="${c.cream}" stroke-width="3"/>
  ${petals}
  ${fish(70, H - 120, -20, c.red)}
  ${fish(W - 70, H - 120, 200, c.green)}
  <g transform="translate(${W / 2} 44)"><circle r="34" fill="${c.red}" stroke="${c.cream}" stroke-width="4"/><circle r="22" fill="${c.yellow}" stroke="${c.cream}" stroke-width="3"/></g>
  <text x="${W / 2}" y="${H - 14}" text-anchor="middle" font-family="sans-serif" font-size="22" font-weight="700" fill="${c.cream}" letter-spacing="3">SHUVAMOS</text>
</svg>`;
}

export default function Camera() {
  const t = useT(dict);
  const ctx = usePhone();
  const video = useRef(null);
  const streamRef = useRef(null);
  const requestRef = useRef(0);
  const frameImg = useRef(null);
  const [state, setStateCam] = useState('idle'); // idle | starting | live | denied | unsupported
  const [shot, setShot] = useState(null);
  const [flash, setFlash] = useState(false);
  const frameUrl = useRef(`data:image/svg+xml;charset=utf-8,${encodeURIComponent(frameSvg())}`);

  const stop = () => {
    requestRef.current += 1;
    streamRef.current?.getTracks().forEach((tr) => tr.stop());
    streamRef.current = null;
    if (video.current) video.current.srcObject = null;
  };

  const start = async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      setStateCam('unsupported');
      return;
    }
    setStateCam('starting');
    const request = ++requestRef.current;
    try {
      const s = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user', width: { ideal: 960 }, height: { ideal: 1280 } }, audio: false });
      if (request !== requestRef.current) { s.getTracks().forEach(tr => tr.stop()); return; }
      streamRef.current = s;
      if (video.current) {
        video.current.srcObject = s;
        await video.current.play().catch(() => {});
      }
      setStateCam('live');
    } catch {
      if (request === requestRef.current) setStateCam('denied');
    }
  };

  useEffect(() => {
    const img = new Image();
    img.src = frameUrl.current;
    frameImg.current = img;
    return stop;
  }, []);

  // Release the camera when the phone scrolls away.
  useEffect(() => {
    if (!ctx.visible) {
      stop();
      setStateCam('idle');
    }
  }, [ctx.visible]);

  useBack(() => {
    if (!shot) return false;
    setShot(null);
    return true;
  });

  const snap = () => {
    const v = video.current;
    if (!v || !v.videoWidth) return;
    const cv = document.createElement('canvas');
    cv.width = W;
    cv.height = H;
    const g = cv.getContext('2d');
    // cover-crop the video into the 3:4 frame, mirrored like a mirror
    const vr = v.videoWidth / v.videoHeight;
    const fr = W / H;
    let sw = v.videoWidth;
    let sh = v.videoHeight;
    if (vr > fr) sw = sh * fr;
    else sh = sw / fr;
    g.save();
    g.translate(W, 0);
    g.scale(-1, 1);
    g.drawImage(v, (v.videoWidth - sw) / 2, (v.videoHeight - sh) / 2, sw, sh, 0, 0, W, H);
    g.restore();
    if (frameImg.current?.complete) g.drawImage(frameImg.current, 0, 0, W, H);
    sfx.shutter();
    setFlash(true);
    setTimeout(() => setFlash(false), 180);
    setShot(cv.toDataURL('image/jpeg', 0.9));
  };

  return (
    <AppShell title={t('app.camera')} sub={t('cam.sub')} className="sos-camera" dark scroll={false}>
      <div className="sos-cam">
        <div className="sos-cam-view">
          <video ref={video} playsInline muted className={state === 'live' && !shot ? 'is-on' : ''} aria-hidden="true" />
          {shot && <img src={shot} alt={t('cam.shotAlt')} className="sos-cam-shot" />}
          {!shot && <img src={frameUrl.current} alt="" className="sos-cam-frame" aria-hidden="true" />}
          {state !== 'live' && !shot && (
            <div className="sos-cam-intro">
              <CameraIcon size={34} weight="fill" aria-hidden="true" />
              <p>{state === 'denied' ? t('cam.denied') : state === 'unsupported' ? t('cam.unsupported') : t('cam.intro')}</p>
              {state !== 'unsupported' && (
                <button type="button" className="sos-pill" onClick={start} disabled={state === 'starting'}>
                  {state === 'starting' ? t('cam.starting') : t('cam.start')}
                </button>
              )}
            </div>
          )}
          {flash && <span className="sos-cam-flash" aria-hidden="true" />}
        </div>
        <p className="sos-cam-privacy">
          <LockKeyIcon size={13} weight="fill" aria-hidden="true" /> {t('cam.privacy')}
        </p>
        <div className="sos-cam-ctrl">
          {shot ? (
            <>
              <button type="button" className="sos-pill is-ghost sos-cam-ghost" onClick={() => setShot(null)}>
                <ArrowCounterClockwiseIcon size={16} weight="bold" />
                {t('cam.retake')}
              </button>
              <a className="sos-pill" href={shot} download="shuvamos-selfie.jpg">
                <DownloadSimpleIcon size={16} weight="bold" />
                {t('cam.save')}
              </a>
            </>
          ) : (
            <button type="button" className="sos-shutter" aria-label={t('cam.snap')} onClick={snap} disabled={state !== 'live'}>
              <span />
            </button>
          )}
        </div>
      </div>
    </AppShell>
  );
}
