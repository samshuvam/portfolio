import { lazy } from 'react';
import {
  AirplaneTiltIcon,
  CalculatorIcon,
  CalendarBlankIcon,
  CameraIcon,
  ChatCircleTextIcon,
  ClockIcon,
  CloudSunIcon,
  EnvelopeSimpleIcon,
  GameControllerIcon,
  GearSixIcon,
  ImagesIcon,
  MapTrifoldIcon,
  MusicNotesIcon,
  NotePencilIcon,
  PhoneIcon,
  WaveformIcon,
} from '@phosphor-icons/react';

// Every app on ShuvamOS. Each one is its own file, loaded when it is first
// opened (or when the visitor hovers its icon). Tints borrow Mithila
// pigments: vermilion, turmeric, leaf green, indigo, lamp black.
const defs = [
  { id: 'phone', icon: PhoneIcon, tint: '#2e8b57', load: () => import('./apps/Dialer.jsx') },
  { id: 'messages', icon: ChatCircleTextIcon, tint: '#3a9a5c', load: () => import('./apps/Messages.jsx') },
  { id: 'mail', icon: EnvelopeSimpleIcon, tint: '#2f62b3', load: () => import('./apps/Mail.jsx') },
  { id: 'music', icon: MusicNotesIcon, tint: '#c8311f', load: () => import('./apps/Music.jsx') },
  { id: 'photos', icon: ImagesIcon, tint: '#f4efe6', ink: '#c8311f', load: () => import('./apps/Photos.jsx') },
  { id: 'camera', icon: CameraIcon, tint: '#3b3d44', load: () => import('./apps/Camera.jsx') },
  { id: 'weather', icon: CloudSunIcon, tint: '#3f86c9', load: () => import('./apps/Weather.jsx') },
  { id: 'clock', icon: ClockIcon, tint: '#16181f', load: () => import('./apps/Clock.jsx') },
  { id: 'calendar', icon: CalendarBlankIcon, tint: '#fbf8f2', ink: '#c8311f', load: () => import('./apps/Calendar.jsx') },
  { id: 'maps', icon: MapTrifoldIcon, tint: '#5a9a4a', load: () => import('./apps/Maps.jsx') },
  { id: 'notes', icon: NotePencilIcon, tint: '#e9a400', load: () => import('./apps/Notes.jsx') },
  { id: 'games', icon: GameControllerIcon, tint: '#27306b', load: () => import('./apps/Games.jsx') },
  { id: 'calculator', icon: CalculatorIcon, tint: '#f08a24', load: () => import('./apps/Calculator.jsx') },
  { id: 'flight', icon: AirplaneTiltIcon, tint: '#1d3f78', load: () => import('./apps/Flight.jsx') },
  { id: 'yapper', icon: WaveformIcon, tint: '#7a1f3d', load: () => import('./apps/Yapper.jsx') },
  { id: 'settings', icon: GearSixIcon, tint: '#6b6e78', load: () => import('./apps/Settings.jsx') },
];

const preloaded = new Set();
export const APPS = defs.map((d) => ({
  ...d,
  Comp: lazy(d.load),
  preload() {
    if (preloaded.has(d.id)) return;
    preloaded.add(d.id);
    d.load().catch(() => preloaded.delete(d.id));
  },
}));

export const appById = (id) => APPS.find((a) => a.id === id);
export const DOCK = ['phone', 'messages', 'mail', 'music'];
export const GRID = ['photos', 'camera', 'weather', 'clock', 'calendar', 'maps', 'notes', 'games', 'calculator', 'flight', 'yapper', 'settings'];
