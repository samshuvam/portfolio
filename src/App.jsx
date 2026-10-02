import { lazy, Suspense, useEffect } from 'react';
import ThemeSync from './components/ThemeSync';
import Intro from './components/intro/Intro';
import Nav from './components/layout/Nav';
import Toasts from './components/layout/Toasts';
import Footer from './components/layout/Footer';
import FlightMap from './components/layout/FlightMap';
import CommandPalette from './components/layout/CommandPalette';
import Passport from './components/layout/Passport';
import EggsController from './components/layout/EggsController';
import Hero from './components/hero/Hero';
import About from './components/sections/About';
import Work from './components/work/Work';
import ProjectDialog from './components/work/ProjectDialog';
import Lab from './components/lab/Lab';
import Arcade from './components/arcade/Arcade';
import Papers from './components/sections/Papers';
import Logbook from './components/sections/Logbook';
import Journey from './components/journey/Journey';
import Home from './components/home/Home';
import Kanya from './components/sections/Kanya';
import Life from './components/life/Life';
import Frames from './components/frames/Frames';
import Wow from './components/wow/Wow';
import Now from './components/sections/Now';
import Contact from './components/contact/Contact';
import Finale from './components/finale/Finale';
import FogReveal from './components/fx/FogReveal';
import WindowView from './components/fx/WindowView';
import Panorama from './components/fx/Panorama';
import JanakiMandir from './components/fx/JanakiMandir';
import { TermCardHost } from './components/ui/Term';
import { startSmoothScroll } from './lib/motion';
import { useAmbient } from './lib/ambient';
import './styles/term-art.css';
import './styles/layout.css';
import './components/layout/tools.css';

const PlaneLayer = lazy(() => import('./three/PlaneLayer'));

export default function App() {
  useAmbient();
  useEffect(() => {
    startSmoothScroll();
  }, []);

  return (
    <>
      <ThemeSync />
      <EggsController />
      <Intro />
      <Nav />
      <Suspense fallback={null}>
        <PlaneLayer />
      </Suspense>
      <main id="main">
        <Hero />
        <About />
        <Work />
        <Lab />
        <Arcade />
        <FogReveal variant="smog">
          <Papers />
        </FogReveal>
        <Logbook />
        <WindowView />
        <Journey />
        <Panorama />
        <Home />
        <JanakiMandir />
        <FogReveal variant="cloud">
          <Kanya />
        </FogReveal>
        <Life />
        <Frames />
        <Wow />
        <Now />
        <Contact />
        <Finale />
      </main>
      <Footer />
      <FlightMap />
      <div className="grain" aria-hidden="true" />
      <Toasts />
      <TermCardHost />
      <ProjectDialog />
      <CommandPalette />
      <Passport />
    </>
  );
}
