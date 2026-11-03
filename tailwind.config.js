/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ivory: {
          DEFAULT: '#FBF7F0',
          50: '#FDFBF7',
          100: '#FBF7F0',
          200: '#F4EDE2',
          300: '#EAE0D1',
        },
        sand: {
          100: '#F3ECE1',
          200: '#E7DDCF',
          300: '#D8CAB6',
          400: '#BFAE96',
        },
        ink: {
          DEFAULT: '#2B2724',
          soft: '#4A433D',
          muted: '#6B625A',
          faint: '#8C8279',
        },
        brand: {
          50: '#FDF4EE',
          100: '#FBE4D5',
          200: '#F5C6A8',
          300: '#EDA078',
          400: '#E2794A',
          500: '#D45F2A',
          600: '#C04A17',
          700: '#9F3C14',
          800: '#7F3217',
          900: '#682B16',
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
        site: '80rem',
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
