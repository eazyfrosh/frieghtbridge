import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './lib/**/*.{ts,tsx}',
  ],
  theme: {
    container: {
      center: true,
      padding: {
        DEFAULT: '1.25rem',
        sm: '1.5rem',
        lg: '2rem',
        xl: '2.5rem',
      },
      screens: {
        '2xl': '1280px',
      },
    },
    extend: {
      colors: {
        // Warm neutral. Deliberately brown-tinted rather than navy so nothing
        // on the page reads as blue. `ink-400` is the lightest step used for
        // body text on white and clears 4.5:1.
        ink: {
          50: '#FBF8F6',
          100: '#F3ECE7',
          200: '#E4D9D1',
          300: '#CBBBAF',
          400: '#7E6B5F',
          500: '#64544A',
          600: '#4C3F37',
          700: '#382E28',
          800: '#261F1A',
          900: '#17110E',
          950: '#0C0806',
        },
        // Primary. `brand-600` is the darkest step still used behind white
        // text — it clears 4.5:1, so buttons stay readable at body size.
        brand: {
          50: '#FFF3EC',
          100: '#FFE3D2',
          200: '#FFC5A3',
          300: '#FF9E67',
          400: '#FF7733',
          500: '#FA5B0A',
          600: '#D1450A',
          700: '#A93706',
          800: '#87300B',
          900: '#6E290C',
        },
        // Warm gold secondary. Lifts the primary without introducing a second
        // hue family — used for highlights, glows and rating marks.
        signal: {
          50: '#FFF9EC',
          100: '#FFF0CE',
          200: '#FFDF9C',
          300: '#FFC961',
          400: '#FBB03B',
          500: '#EE9412',
          600: '#CC7409',
          700: '#A2530C',
          800: '#844210',
          900: '#6E3711',
        },
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        display: ['var(--font-display)', 'var(--font-inter)', 'sans-serif'],
      },
      fontSize: {
        '7xl': ['4.5rem', { lineHeight: '1.02', letterSpacing: '-0.035em' }],
        '8xl': ['5.75rem', { lineHeight: '1', letterSpacing: '-0.04em' }],
      },
      borderRadius: {
        '4xl': '2rem',
        '5xl': '2.75rem',
      },
      boxShadow: {
        soft: '0 1px 2px rgba(23,17,14,0.05), 0 8px 24px -12px rgba(23,17,14,0.13)',
        card: '0 2px 4px rgba(23,17,14,0.04), 0 18px 40px -20px rgba(23,17,14,0.20)',
        lift: '0 8px 12px -6px rgba(23,17,14,0.09), 0 32px 64px -28px rgba(23,17,14,0.30)',
        glow: '0 24px 70px -30px rgba(209,69,10,0.6)',
      },
      backgroundImage: {
        'grid-light':
          'linear-gradient(to right, rgba(23,17,14,0.06) 1px, transparent 1px), linear-gradient(to bottom, rgba(23,17,14,0.06) 1px, transparent 1px)',
        'grid-dark':
          'linear-gradient(to right, rgba(255,255,255,0.055) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.055) 1px, transparent 1px)',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        shimmer: {
          '100%': { transform: 'translateX(100%)' },
        },
        'pulse-ring': {
          '0%': { transform: 'scale(0.7)', opacity: '0.7' },
          '80%, 100%': { transform: 'scale(2.2)', opacity: '0' },
        },
        dash: {
          to: { strokeDashoffset: '-1000' },
        },
      },
      animation: {
        float: 'float 7s ease-in-out infinite',
        shimmer: 'shimmer 2s infinite',
        'pulse-ring': 'pulse-ring 2.6s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        dash: 'dash 24s linear infinite',
      },
      transitionTimingFunction: {
        premium: 'cubic-bezier(0.22, 1, 0.36, 1)',
      },
      transitionDuration: {
        400: '400ms',
        600: '600ms',
      },
    },
  },
  plugins: [],
};

export default config;
