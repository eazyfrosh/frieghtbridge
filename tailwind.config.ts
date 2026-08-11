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
        // True neutral. The scheme is orange and white, so the greys stay
        // untinted — no navy cast, no brown cast. `ink-400` is the lightest
        // step used for body text on white and clears 4.5:1.
        ink: {
          50: '#F8F8F8',
          100: '#EFEFEF',
          200: '#DCDCDC',
          300: '#BFBFBF',
          400: '#6E6E6E',
          500: '#565656',
          600: '#414141',
          700: '#2E2E2E',
          800: '#1F1F1F',
          900: '#121212',
          950: '#0A0A0A',
        },
        // Primary — a genuinely bright orange. `brand-500` is the band and
        // button colour and is paired with near-black text (6.5:1); white text
        // on it is only 2.9:1, so the bands read dark-on-bright, not the
        // reverse. `brand-700` is the darker step for accent text on white,
        // where the bright shade would only reach 2.9:1.
        brand: {
          50: '#FFF4EA',
          100: '#FFE5C9',
          200: '#FFC894',
          300: '#FFA758',
          400: '#FF8A22',
          500: '#FF6A00',
          600: '#E25100',
          700: '#C24500',
          800: '#9C3800',
          900: '#7A2D00',
        },
        // Warm off-white for the hero surface — a touch softer than pure white
        // so the white floating cards read as raised against it.
        canvas: '#F7F7F5',
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
        soft: '0 1px 2px rgba(18,18,18,0.05), 0 8px 24px -12px rgba(18,18,18,0.13)',
        card: '0 2px 4px rgba(18,18,18,0.04), 0 18px 40px -20px rgba(18,18,18,0.20)',
        lift: '0 8px 12px -6px rgba(18,18,18,0.09), 0 32px 64px -28px rgba(18,18,18,0.30)',
        glow: '0 24px 70px -30px rgba(255,106,0,0.55)',
      },
      backgroundImage: {
        'grid-light':
          'linear-gradient(to right, rgba(18,18,18,0.06) 1px, transparent 1px), linear-gradient(to bottom, rgba(18,18,18,0.06) 1px, transparent 1px)',
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
