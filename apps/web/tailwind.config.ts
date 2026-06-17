import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './lib/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // SugarCRM "frost" light system
        canvas: '#eef1f6', // app background
        surface: '#ffffff', // cards
        ink: '#0f172a', // primary text
        subtle: '#64748b', // secondary text
        hairline: '#e8ebf1', // borders
        brand: {
          50: '#eff4ff',
          100: '#dbe6ff',
          500: '#3b6ef5',
          600: '#2f5fe0',
          700: '#264dbd',
        },
        accent: {
          coral: '#ff7a59',
          mint: '#34d399',
          amber: '#fbbf24',
          violet: '#8b5cf6',
        },
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        xl: '1rem',
        '2xl': '1.5rem',
        '3xl': '2rem',
      },
      boxShadow: {
        frost: '0 1px 2px rgba(15,23,42,0.04), 0 8px 24px rgba(15,23,42,0.06)',
        'frost-lg': '0 2px 4px rgba(15,23,42,0.04), 0 16px 40px rgba(15,23,42,0.08)',
      },
    },
  },
  plugins: [],
};

export default config;
