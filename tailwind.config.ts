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
        ink: {
          50: '#F4F6FA',
          100: '#E6EBF3',
          200: '#C9D3E4',
          300: '#9FAFC9',
          400: '#6C81A1',
          500: '#4A5F80',
          600: '#334765',
          700: '#22334C',
          800: '#152134',
          900: '#0B1524',
          950: '#050B15',
        },
        brand: {
          50: '#EEF3FF',
          100: '#DCE6FF',
          200: '#BACDFF',
          300: '#8DAAFF',
          400: '#5B80FF',
          500: '#2F5BFF',
          600: '#1A3EE8',
          700: '#152FB8',
          800: '#152A91',
          900: '#172973',
        },
        signal: {
          50: '#FFF4ED',
          100: '#FFE5D4',
          200: '#FFC7A8',
          300: '#FFA170',
          400: '#FF7A38',
          500: '#FF5C0A',
          600: '#F04405',
          700: '#C73206',
          800: '#9E2A0E',
          900: '#7F250F',
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
        soft: '0 1px 2px rgba(11,21,36,0.04), 0 8px 24px -12px rgba(11,21,36,0.12)',
        card: '0 2px 4px rgba(11,21,36,0.03), 0 18px 40px -20px rgba(11,21,36,0.22)',
        lift: '0 8px 12px -6px rgba(11,21,36,0.08), 0 32px 64px -28px rgba(11,21,36,0.35)',
        glow: '0 24px 70px -30px rgba(47,91,255,0.65)',
      },
      backgroundImage: {
        'grid-light':
          'linear-gradient(to right, rgba(11,21,36,0.055) 1px, transparent 1px), linear-gradient(to bottom, rgba(11,21,36,0.055) 1px, transparent 1px)',
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
