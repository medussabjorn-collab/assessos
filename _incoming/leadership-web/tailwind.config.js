/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          50:  '#f0f4ff',
          100: '#e0e9ff',
          200: '#c7d7fe',
          300: '#a5bbfd',
          400: '#8193fb',
          500: '#6366f1',
          600: '#4f46e5',
          700: '#4338ca',
          800: '#3730a3',
          900: '#312e81',
          950: '#1e1b4b',
        },
        surface: {
          DEFAULT: '#ffffff',
          dark:    '#0A0A0B',
          card:    '#f9fafb',
          'card-dark': '#111113',
          border:  '#e5e7eb',
          'border-dark': '#1f2023',
        },
        // Frost theme accents (light SaaS journey dashboard)
        accent: {
          blue:  '#5b8def',
          'blue-soft': '#aac4f5',
          coral: '#ef6b6b',
          'coral-soft': '#f6b3b3',
        },
        frost: {
          50:  '#f5f6fa',
          100: '#eef0f5',
          200: '#e7e9f4',
          300: '#dfe2f0',
        },
      },
      fontFamily: {
        sans: ['-apple-system','BlinkMacSystemFont','"SF Pro Display"','"Segoe UI"','Roboto','sans-serif'],
        mono: ['"SF Mono"','"Fira Code"','"Cascadia Code"','monospace'],
      },
      borderRadius: { '2xl': '1rem', '3xl': '1.5rem', '4xl': '2rem' },
      boxShadow: {
        glass:   '0 8px 32px 0 rgba(31,38,135,0.07)',
        'glass-dark': '0 8px 32px 0 rgba(0,0,0,0.4)',
        glow:    '0 0 20px rgba(99,102,241,0.3)',
        'glow-lg': '0 0 40px rgba(99,102,241,0.2)',
        card:    '0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)',
        'card-lg': '0 10px 40px rgba(0,0,0,0.08)',
        apple:   '0 2px 8px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.08)',
      },
      animation: {
        'fade-in':    'fadeIn 0.5s ease-out',
        'slide-up':   'slideUp 0.4s ease-out',
        'slide-down': 'slideDown 0.4s ease-out',
        'scale-in':   'scaleIn 0.3s ease-out',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4,0,0.6,1) infinite',
        'spin-slow':  'spin 3s linear infinite',
        'bounce-subtle': 'bounceSubtle 2s ease-in-out infinite',
      },
      keyframes: {
        fadeIn:       { '0%': { opacity: '0' }, '100%': { opacity: '1' } },
        slideUp:      { '0%': { opacity: '0', transform: 'translateY(20px)' }, '100%': { opacity: '1', transform: 'translateY(0)' } },
        slideDown:    { '0%': { opacity: '0', transform: 'translateY(-20px)' }, '100%': { opacity: '1', transform: 'translateY(0)' } },
        scaleIn:      { '0%': { opacity: '0', transform: 'scale(0.95)' }, '100%': { opacity: '1', transform: 'scale(1)' } },
        bounceSubtle: { '0%,100%': { transform: 'translateY(0)' }, '50%': { transform: 'translateY(-4px)' } },
      },
      backdropBlur: { xs: '2px' },
    },
  },
  plugins: [],
}
