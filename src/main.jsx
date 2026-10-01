import React, { lazy, Suspense } from 'react';
import { createRoot } from 'react-dom/client';
import '@fontsource-variable/bricolage-grotesque/standard.css';
import '@fontsource-variable/geist';
import '@fontsource-variable/geist-mono';
import '@fontsource/tiro-devanagari-hindi/devanagari-400.css';
import '@fontsource/tiro-devanagari-hindi/latin-400.css';
import '@fontsource/tiro-devanagari-hindi/latin-400-italic.css';
import '@fontsource/noto-sans-tirhuta/400.css';
import '@fontsource-variable/noto-sans-devanagari';
import './styles/index.css';
import App from './App.jsx';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }
  static getDerivedStateFromError(error) {
    return { error };
  }
  componentDidCatch(error, info) {
    console.error('Something broke while rendering:', error, info);
  }
  render() {
    if (this.state.error) {
      return (
        <main style={{ maxWidth: '40rem', margin: '6rem auto', padding: '0 1.25rem', fontFamily: 'system-ui, sans-serif', lineHeight: 1.6 }}>
          <h1 style={{ fontSize: '2rem', marginBottom: '1rem' }}>Unexpected turbulence.</h1>
          <p>Something on this page failed to load. A refresh usually fixes it. If not, you can still reach Shuvam at <a href="mailto:suvmith@gmail.com">suvmith@gmail.com</a> or grab the <a href="/CV.pdf">CV</a>.</p>
          <button type="button" onClick={() => window.location.reload()} style={{ marginTop: '1rem', padding: '0.7rem 1.2rem', borderRadius: 999, border: '1px solid currentColor', background: 'transparent' }}>
            Reload
          </button>
        </main>
      );
    }
    return this.props.children;
  }
}

// Dev-only preview pages: http://localhost:3000/?lab=<name> renders
// src/dev/labs/<name>.jsx on its own (handy for building one piece at a time).
const labs = import.meta.env.DEV ? import.meta.glob('./dev/labs/*.jsx') : {};
const labName = new URLSearchParams(window.location.search).get('lab');
const labLoader = labName ? labs[`./dev/labs/${labName}.jsx`] : null;
const Root = labLoader ? lazy(labLoader) : App;

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <Suspense fallback={null}>
        <Root />
      </Suspense>
    </ErrorBoundary>
  </React.StrictMode>,
);
