/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,jsx}', './components/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        navy: {
          DEFAULT: '#102A41',
          deep: '#0B1F30',
        },
        parchment: {
          DEFAULT: '#FAF6EC',
          dim: '#F1EBDB',
        },
        gold: {
          DEFAULT: '#D9933D',
          dark: '#B5541F',
          light: '#F0C383',
        },
        teal: {
          DEFAULT: '#1F6B6B',
          dark: '#154E4E',
        },
        ink: '#1B2430',
      },
      fontFamily: {
        display: ['var(--font-fraunces)', 'Georgia', 'serif'],
        body: ['var(--font-inter)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-plex-mono)', 'ui-monospace', 'monospace'],
      },
      boxShadow: {
        card: '0 1px 2px rgba(16, 42, 65, 0.06), 0 1px 12px rgba(16, 42, 65, 0.08)',
      },
    },
  },
  plugins: [],
};
