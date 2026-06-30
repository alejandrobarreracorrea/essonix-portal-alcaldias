/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        paper: 'var(--paper)',
        surface: {
          DEFAULT: 'var(--surface)',
          2: 'var(--surface-2)',
        },
        ink: {
          DEFAULT: 'var(--ink)',
          soft: 'var(--ink-soft)',
        },
        line: 'var(--line)',
        forest: {
          DEFAULT: 'var(--forest)',
          700: 'var(--forest-700)',
          deep: 'var(--forest-deep)',
          ink: 'var(--forest-ink)',
        },
        gold: {
          DEFAULT: 'var(--gold)',
          soft: 'var(--gold-soft)',
        },
        clay: 'var(--clay)',
        teal: 'var(--teal)',
        sage: 'var(--sage)',
        sand: 'var(--sand)',
      },
      fontFamily: {
        display: ['Fraunces', 'serif'],
        sans: ['Archivo', 'system-ui', 'sans-serif'],
        mono: ['"Spline Sans Mono"', 'monospace'],
      },
      borderRadius: {
        card: '16px',
        xl2: '20px',
      },
      boxShadow: {
        card: '0 1px 2px rgba(20,36,29,.04), 0 16px 34px -20px rgba(10,61,46,.25)',
        pop: '0 24px 48px -24px rgba(10,61,46,.35)',
        sidebar: '0 0 40px -10px rgba(10,61,46,.45)',
      },
    },
  },
  plugins: [],
}
