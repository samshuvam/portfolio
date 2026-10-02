import { useState } from 'react';
import { useT, useLang, localDigits } from '../../../i18n';
import dict from '../../../i18n/ui/phone';
import { AppShell } from '../parts';
import { sfx } from '../audio';
import '../apps.css';

// A tidy calculator with opinions. Dividing by zero offends a Kanya.
const OPS = { '÷': (a, b) => a / b, '×': (a, b) => a * b, '−': (a, b) => a - b, '+': (a, b) => a + b };
const SPECIAL = { 2504: 'calc.2504', 8848.86: 'calc.everest', 108: 'calc.108', 545: 'calc.545', 2083: 'calc.2083', 42: 'calc.42', 1910: 'calc.1910' };

const fmt = (n) => {
  if (!Number.isFinite(n)) return 'Error';
  const r = Math.round(n * 1e10) / 1e10;
  const s = String(r);
  if (s.length <= 11) return s;
  return r.toPrecision(8).replace(/\.?0+(e|$)/, '$1');
};

export default function Calculator() {
  const t = useT(dict);
  const lang = useLang();
  const [display, setDisplay] = useState('0');
  const [acc, setAcc] = useState(null);
  const [op, setOp] = useState(null);
  const [fresh, setFresh] = useState(true);
  const [quip, setQuip] = useState('');

  const value = parseFloat(display);
  const input = (d) => {
    sfx.tap();
    setQuip('');
    if (display === 'Error' || fresh) {
      setDisplay(d === '.' ? '0.' : d);
      setFresh(false);
      return;
    }
    if (d === '.' && display.includes('.')) return;
    if (display.replace(/[-.]/g, '').length >= 10) return;
    setDisplay(display === '0' && d !== '.' ? d : display + d);
  };

  const compute = () => {
    if (op === null || acc === null) return value;
    if (op === '÷' && value === 0) return null;
    return OPS[op](acc, value);
  };

  const finish = (result) => {
    if (result === null) {
      setDisplay('Error');
      setQuip(t('calc.zero'));
      setAcc(null);
      setOp(null);
      setFresh(true);
      sfx.thud();
      return false;
    }
    setDisplay(fmt(result));
    const key = SPECIAL[Math.round(result * 100) / 100];
    setQuip(key ? t(key) : '');
    return true;
  };

  const pressOp = (o) => {
    sfx.tap();
    if (display === 'Error') return;
    if (op && !fresh) {
      const r = compute();
      if (!finish(r)) return;
      setAcc(r);
    } else setAcc(value);
    setOp(o);
    setFresh(true);
  };

  const equals = () => {
    sfx.tap();
    if (op === null) {
      const key = SPECIAL[value];
      if (key) setQuip(t(key));
      return;
    }
    finish(compute());
    setAcc(null);
    setOp(null);
    setFresh(true);
  };

  const clear = () => {
    sfx.tap();
    if (!fresh && display !== '0') {
      setDisplay('0');
      setFresh(true);
      return;
    }
    setDisplay('0');
    setAcc(null);
    setOp(null);
    setQuip('');
  };

  const onKey = (e) => {
    const k = e.key;
    if (/^[0-9]$/.test(k) || k === '.') input(k);
    else if (k === '+') pressOp('+');
    else if (k === '-') pressOp('−');
    else if (k === '*' || k === 'x') pressOp('×');
    else if (k === '/') pressOp('÷');
    else if (k === 'Enter' || k === '=') equals();
    else if (k === 'Backspace') setDisplay((d) => (fresh || d.length <= 1 || d === 'Error' ? '0' : d.slice(0, -1)));
    else if (k === 'Delete') clear();
    else return;
    e.preventDefault();
  };

  const showing = display === 'Error' ? t('calc.error') : localDigits(display.length > 3 && !display.includes('e') ? Number(display).toLocaleString('en', { maximumFractionDigits: 10 }) + (display.endsWith('.') ? '.' : '') : display, lang);
  const key = (label, onClick, cls = '', aria) => (
    <button key={aria} type="button" className={`sos-calc-key ${cls}`} onClick={onClick} aria-label={aria}>
      {label}
    </button>
  );

  return (
    <AppShell title={t('app.calculator')} className="sos-calc" dark scroll={false}>
      <div className="sos-calc-body" onKeyDown={onKey}>
        <div className="sos-calc-screen">
          <p className="sos-calc-quip" aria-live="polite">
            {quip}
          </p>
          <output className={`sos-calc-out ${showing.length > 9 ? 'is-long' : ''}`} aria-live="polite">
            {showing}
          </output>
        </div>
        <div className="sos-calc-keys">
          {key(!fresh && display !== '0' ? 'C' : 'AC', clear, 'is-fn', t('calc.clear'))}
          {key('±', () => setDisplay((d) => (d === 'Error' || d === '0' ? d : d.startsWith('-') ? d.slice(1) : `-${d}`)), 'is-fn', t('calc.sign'))}
          {key('%', () => setDisplay((d) => (d === 'Error' ? d : fmt(parseFloat(d) / 100))), 'is-fn', t('calc.pct'))}
          {key('÷', () => pressOp('÷'), `is-op ${op === '÷' && fresh ? 'is-on' : ''}`, t('calc.div'))}
          {['7', '8', '9'].map((d) => key(localDigits(d, lang), () => input(d), '', d))}
          {key('×', () => pressOp('×'), `is-op ${op === '×' && fresh ? 'is-on' : ''}`, t('calc.mul'))}
          {['4', '5', '6'].map((d) => key(localDigits(d, lang), () => input(d), '', d))}
          {key('−', () => pressOp('−'), `is-op ${op === '−' && fresh ? 'is-on' : ''}`, t('calc.sub'))}
          {['1', '2', '3'].map((d) => key(localDigits(d, lang), () => input(d), '', d))}
          {key('+', () => pressOp('+'), `is-op ${op === '+' && fresh ? 'is-on' : ''}`, t('calc.add'))}
          {key(localDigits('0', lang), () => input('0'), 'is-zero', '0')}
          {key('.', () => input('.'), '', t('calc.dot'))}
          {key('=', equals, 'is-op', t('calc.eq'))}
        </div>
      </div>
    </AppShell>
  );
}
