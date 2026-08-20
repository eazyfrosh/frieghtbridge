import type { Config } from 'tailwindcss';

const config: Config = {
  // Class-based, not media-based: the visitor gets a toggle, and a media
  // query cannot be overridden by a choice.
  darkMode: 'class',
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
        /**
         * Dark blue, used for the footer band.
         *
         * Named rather than inlined because a second brand ground deserves a
         * token — the next person adding a dark section should reach for this
         * instead of picking their own navy. White on `navy-900` measures
         * 16.5:1, so every weight of text on it clears AAA.
         */
        navy: {
          800: '#16294F',
          900: '#0F1E3D',
        },

        /**
         * The neutral scale, and the whole of dark mode.
         *
         * These resolve through CSS variables that `globals.css` redefines
         * under `.dark`, so a component written as `text-ink-900` on
         * `bg-surface` is correct in both themes without a single `dark:`
         * variant. That matters at this size: there are ~685 `ink-*` uses
         * across 30-odd components, and hand-writing a dark counterpart for
         * each would be a permanent tax on every future edit.
         *
         * Read the steps by role, not by lightness: `ink-900` is "primary
         * text", `ink-400` is "muted text", `ink-100` is "hairline". In dark
         * mode the ramp inverts, so those roles hold and the numbers stop
         * describing brightness.
         */
        ink: {
          50: 'rgb(var(--ink-50) / <alpha-value>)',
          100: 'rgb(var(--ink-100) / <alpha-value>)',
          200: 'rgb(var(--ink-200) / <alpha-value>)',
          300: 'rgb(var(--ink-300) / <alpha-value>)',
          400: 'rgb(var(--ink-400) / <alpha-value>)',
          500: 'rgb(var(--ink-500) / <alpha-value>)',
          600: 'rgb(var(--ink-600) / <alpha-value>)',
          700: 'rgb(var(--ink-700) / <alpha-value>)',
          800: 'rgb(var(--ink-800) / <alpha-value>)',
          900: 'rgb(var(--ink-900) / <alpha-value>)',
          950: 'rgb(var(--ink-950) / <alpha-value>)',
        },

        /**
         * Page and card grounds: white in light, near-black in dark.
         *
         * Distinct from `ink-50`, which is the *subtle* alternate ground.
         * `surface` replaced the literal `bg-white`, which could not flip.
         */
        surface: 'rgb(var(--surface) / <alpha-value>)',

        /**
         * Neutrals that must stay dark in **both** themes.
         *
         * Two things need this. Deliberate dark bands — the admin rail, the
         * sign-in page, dark feature cards — are a design choice, not an
         * absence of light, and inverting them would turn the rail white while
         * its text stayed white. And dark text on a bright orange button has
         * to remain dark: white on `brand-500` is 2.9:1 and fails at any size.
         */
        night: {
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
        // Warm off-white for the hero surface in light mode, so the raised
        // cards read against it; a step above the page ground in dark, where
        // the same separation has to come from being lighter, not darker.
        canvas: 'rgb(var(--canvas) / <alpha-value>)',
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
