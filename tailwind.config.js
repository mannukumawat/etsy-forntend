/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ivory: {
          DEFAULT: '#FAF7F2',
          50: '#FDFCF9',
          100: '#FAF7F2',
          200: '#F2EBE0',
          300: '#E8DED1',
        },
        sand: {
          100: '#F2EAE0',
          200: '#E8DED1',
          300: '#D5C8B5',
          400: '#BFAE96',
        },
        ink: {
          DEFAULT: '#302820',
          soft: '#4C3E35',
          muted: '#6B5E54',
          faint: '#8C8078',
        },
        brand: {
          50: '#FDF4EE',
          100: '#FAE3D5',
          200: '#F2C2A4',
          300: '#E69A73',
          400: '#D4724A',
          500: '#C05A35',
          600: '#A64B32',
          700: '#8A3E2A',
          800: '#6F3222',
          900: '#5A2A1C',
        },
        sage: {
          100: '#EAEDE3',
          500: '#6F7D5C',
          700: '#4C5A3D',
        },
        star: '#C98A0B',
      },
      fontFamily: {
        serif: ['"Cormorant Garamond"', '"Noto Serif Devanagari"', 'Georgia', 'serif'],
        sans: ['"Inter Variable"', '"Noto Sans Devanagari"', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
      },
      boxShadow: {
        card: '0 1px 2px rgba(43, 39, 36, 0.04), 0 2px 8px rgba(43, 39, 36, 0.05)',
        lift: '0 4px 20px rgba(43, 39, 36, 0.10)',
        drawer: '0 0 40px rgba(43, 39, 36, 0.18)',
      },
      borderRadius: {
        xl: '0.875rem',
        '2xl': '1.125rem',
      },
      maxWidth: {
        site: '85rem',
      },
      keyframes: {
        'fade-in': { from: { opacity: '0' }, to: { opacity: '1' } },
        'slide-in-right': { from: { transform: 'translateX(100%)' }, to: { transform: 'translateX(0)' } },
        'slide-in-left': { from: { transform: 'translateX(-100%)' }, to: { transform: 'translateX(0)' } },
        'toast-in': { from: { opacity: '0', transform: 'translateY(8px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
      },
      animation: {
        'fade-in': 'fade-in 150ms ease-out',
        'slide-in-right': 'slide-in-right 220ms ease-out',
        'slide-in-left': 'slide-in-left 220ms ease-out',
        'toast-in': 'toast-in 180ms ease-out',
      },
    },
  },
  plugins: [],
};
