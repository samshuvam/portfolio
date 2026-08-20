/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        background: '#090a0f',
        card: '#12141e',
        'card-border': '#1e2238',
        cyber: {
          cyan: '#00f5d4',
          blue: '#3b82f6',
          purple: '#8b5cf6',
          violet: '#7928ca',
          pink: '#f72585',
          emerald: '#10b981',
          amber: '#f59e0b',
        },
      },
      fontFamily: {
        sans: ['Space Grotesk', 'Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
        display: ['Orbitron', 'Space Grotesk', 'sans-serif'],
      },
      animation: {
        'glow-pulse': 'glowPulse 4s ease-in-out infinite',
        'float': 'float 6s ease-in-out infinite',
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'radar-sweep': 'radarSweep 4s linear infinite',
        'matrix-fall': 'matrixFall 20s linear infinite',
        'spin-slow': 'spin 12s linear infinite',
      },
      keyframes: {
        glowPulse: {
          '0%, 100%': { opacity: '0.4', filter: 'drop-shadow(0 0 15px rgba(0, 245, 212, 0.4))' },
          '50%': { opacity: '0.8', filter: 'drop-shadow(0 0 25px rgba(121, 40, 202, 0.6))' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        radarSweep: {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        },
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'cyber-grid': 'linear-gradient(to right, rgba(255, 255, 255, 0.03) 1px, transparent 1px), linear-gradient(to bottom, rgba(255, 255, 255, 0.03) 1px, transparent 1px)',
        'hero-gradient': 'radial-gradient(circle at 50% 20%, rgba(0, 245, 212, 0.12), rgba(121, 40, 202, 0.08) 40%, transparent 70%)',
      },
    },
  },
  plugins: [],
}
