import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        arabic: ['"Noto Naskh Arabic"', 'Arial', 'serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['"Fraunces"', 'serif'],
      },
      colors: {
        // Palestinian / Levantine palette
        stone: {
          50: '#f5efe3',    // warm Jerusalem limestone, light
          100: '#e8dcc0',
          200: '#d4b88f',   // Jerusalem stone
          300: '#b89d75',
          400: '#9d8464',
          500: '#8b7355',   // mid stone
          600: '#6b5745',
          700: '#4a3a2c',   // dark stone
          800: '#3a2e24',
          900: '#2a1f18',
        },
        olive: {
          100: '#d4ddb8',
          300: '#8a9d5f',
          500: '#6b7f3c',   // olive leaf
          600: '#5a7030',
          700: '#4a5a2c',
          800: '#2a3e1f',
          900: '#1a2e0f',
        },
        night: {
          500: '#2d3a5c',
          700: '#1a2847',
          800: '#0f1a2e',   // deep Bethlehem night
          900: '#0a1428',
        },
        terracotta: {
          400: '#d6775b',
          500: '#b5553b',   // clay / warm red earth
          600: '#8b3f2c',
        },
        gold: {
          400: '#f0d060',
          500: '#d4a64a',   // Dome of the Rock gold
          600: '#b88a30',
        },
        // Keep brand (purple) as a legacy fallback but prefer olive/gold now
        brand: {
          50: '#f5f3ff',
          100: '#ede9fe',
          500: '#d4a64a',    // remap: brand now = gold
          600: '#b88a30',
          700: '#6b7f3c',    // deeper = olive
          900: '#4c1d95',
        },
      },
      backgroundImage: {
        'keffiyeh': "url('/art/keffiyeh.svg')",
      },
    },
  },
  plugins: [],
};
export default config;
