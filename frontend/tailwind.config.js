/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        display: ['Fraunces', 'ui-serif', 'Georgia', 'serif'],
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
      colors: {
        cream: {
          50: '#FDFBF6',
          100: '#FBF8F1',
          200: '#F5EFE0',
          300: '#EBE2CC',
        },
        ink: {
          900: '#1A1814',
          800: '#2C2820',
          700: '#3D372D',
          600: '#5C5447',
          500: '#7A7163',
        },
        rust: {
          400: '#D97757',
          500: '#C2410C',
          600: '#9A3412',
        },
        accent: {
          DEFAULT: '#3730A3',
          light: '#6366F1',
          deep: '#1E1B4B',
        },
      },
      boxShadow: {
        soft: '0 1px 2px rgba(28, 24, 20, 0.04), 0 4px 16px rgba(28, 24, 20, 0.06)',
        lift: '0 4px 8px rgba(28, 24, 20, 0.06), 0 16px 40px rgba(28, 24, 20, 0.08)',
      },
      keyframes: {
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'subtle-float': {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-4px)' },
        },
      },
      animation: {
        'fade-up': 'fade-up 0.6s ease-out forwards',
        'subtle-float': 'subtle-float 4s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}
