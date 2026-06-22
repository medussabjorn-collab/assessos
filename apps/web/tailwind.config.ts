import type { Config } from 'tailwindcss';

// Design language synthesized from HackerRank, HackerEarth and Mercer|Mettl:
// white canvas, deep teal/charcoal ink, a green primary (the assessment-
// platform signal), clean Inter type, and crisp (8–14px) corners.
const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './lib/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        canvas: '#f4f7f9', // cool off-white app background
        surface: '#ffffff', // cards
        ink: '#0b1f24', // headings / nav anchor (deep teal-charcoal)
        subtle: '#5a6b72', // secondary text
        hairline: '#e4eaee', // borders
        brand: {
          50: '#ecfdf3',
          100: '#d1fadf',
          500: '#19aa59', // HackerRank/Mettl green
          600: '#13934c',
          700: '#0e7a3e',
        },
        accent: {
          coral: '#ff7a59',
          mint: '#19aa59',
          amber: '#f59e0b',
          violet: '#9fb1fe', // HackerEarth periwinkle
          teal: '#0e7490',
        },
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        xl: '0.625rem', // 10px
        '2xl': '0.875rem', // 14px
        '3xl': '1.25rem', // 20px
      },
      boxShadow: {
        frost: '0 1px 2px rgba(11,31,36,0.05), 0 4px 16px rgba(11,31,36,0.06)',
        'frost-lg': '0 2px 4px rgba(11,31,36,0.05), 0 12px 32px rgba(11,31,36,0.10)',
      },
    },
  },
  plugins: [],
};

export default config;
