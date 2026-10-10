/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        fintech: {
          bg: '#F7F8FA',
          surface: '#FFFFFF',
          card: '#FFFFFF',
          subtle: '#F1F3F6',
          border: '#E7E9ED',
          borderStrong: '#D1D5DB',
          ink: '#17191C',
          muted: '#737983',
          faint: '#9DA3AE',
          accent: '#176B57',
          accentHover: '#125645',
          accentSoft: '#EAF5F0',
          positive: '#16835D',
          positiveSoft: '#EAF5F0',
          negative: '#C84B4B',
          negativeSoft: '#FDF2F2',
          warning: '#D97706',
          warningSoft: '#FEF7EC',
        },
        brand: {
          50: '#EAF5F0',
          100: '#D2ECE1',
          500: '#16835D',
          600: '#176B57',
          700: '#115243',
          800: '#0C3B30',
          900: '#17191C',
        },
        profit: {
          50: '#EAF5F0',
          100: '#D2ECE1',
          500: '#16835D',
          600: '#176B57',
          700: '#115243',
        },
        loss: {
          50: '#FDF2F2',
          100: '#FCE4E4',
          500: '#C84B4B',
          600: '#B53C3C',
          700: '#992B2B',
        },
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      boxShadow: {
        xs: '0 1px 2px 0 rgba(0, 0, 0, 0.03)',
        sm: '0 1px 3px 0 rgba(0, 0, 0, 0.04), 0 1px 2px -1px rgba(0, 0, 0, 0.04)',
        card: '0 2px 8px -2px rgba(16, 24, 40, 0.04), 0 1px 4px -1px rgba(16, 24, 40, 0.02)',
        dropdown: '0 10px 25px -5px rgba(0, 0, 0, 0.08), 0 8px 10px -6px rgba(0, 0, 0, 0.03)',
        modal: '0 20px 35px -10px rgba(0, 0, 0, 0.12), 0 10px 15px -5px rgba(0, 0, 0, 0.04)',
      },
    },
  },
  plugins: [],
}
