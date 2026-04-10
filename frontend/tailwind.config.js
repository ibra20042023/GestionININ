/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Palette ININ — extraite du logo
        azure: {
          50:  '#eef5ff',
          100: '#d9eaff',
          200: '#bcd8ff',
          300: '#8ebeff',
          400: '#5a9bff',
          500: '#2d73f5',
          600: '#1a56e8',
          700: '#1640c8',  // Bleu principal du logo
          800: '#1834a0',
          900: '#1a2f7a',
          950: '#141e4f',
        },
        cyan: {
          50:  '#edfcfc',
          100: '#d2f6f7',
          200: '#aaedf0',
          300: '#6cdfe5',
          400: '#30c8d3',  // Cyan/Turquoise accent du logo
          500: '#17a8b5',
          600: '#178799',
          700: '#1a6d7c',
          800: '#1d5865',
          900: '#1c4a56',
          950: '#0c2f39',
        },
        neutral: {
          50:  '#f8f9fa',
          100: '#f1f3f5',
          200: '#e9ecef',
          300: '#dee2e6',
          400: '#ced4da',
          500: '#adb5bd',
          600: '#868e96',
          700: '#495057',
          800: '#343a40',
          900: '#212529',
          950: '#0d0f12',
        },
      },
      fontFamily: {
        // Display : serif élégant pour les titres
        display: ['"Playfair Display"', 'Georgia', 'serif'],
        // Body : sans-serif lisible pour le contenu
        body:    ['"DM Sans"', 'sans-serif'],
        // Mono : pour les labels et données chiffrées
        mono:    ['"JetBrains Mono"', 'monospace'],
      },
      fontSize: {
        '2xs': ['0.65rem', { lineHeight: '1rem' }],
      },
      boxShadow: {
        'card':   '0 2px 16px 0 rgba(26, 64, 200, 0.08)',
        'card-hover': '0 8px 32px 0 rgba(26, 64, 200, 0.16)',
        'nav':    '0 1px 24px 0 rgba(0, 0, 0, 0.08)',
        'hero':   'inset 0 0 0 2000px rgba(10, 20, 60, 0.52)',
      },
      backgroundImage: {
        'gradient-azure': 'linear-gradient(135deg, #1640c8 0%, #17a8b5 100%)',
        'gradient-hero':  'linear-gradient(to right, rgba(10,20,60,0.75) 0%, rgba(10,20,60,0.2) 100%)',
      },
      animation: {
        'fade-up':    'fadeUp 0.6s ease both',
        'fade-in':    'fadeIn 0.5s ease both',
        'slide-right':'slideRight 0.5s ease both',
        'count-up':   'countUp 0.8s ease both',
      },
      keyframes: {
        fadeUp: {
          '0%':   { opacity: '0', transform: 'translateY(24px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        fadeIn: {
          '0%':   { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideRight: {
          '0%':   { opacity: '0', transform: 'translateX(-24px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
      },
      transitionTimingFunction: {
        'spring': 'cubic-bezier(0.34, 1.56, 0.64, 1)',
      },
    },
  },
  plugins: [],
}