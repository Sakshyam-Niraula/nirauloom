/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        forest: {
          950: '#071511',
          900: '#0D2620',
          850: '#112F28',
          800: '#173F35', // Primary brand color
          700: '#1E4F43',
          600: '#286858',
          500: '#348672',
          400: '#46A890',
        },
        sand: {
          50: '#FBF9F5',
          100: '#F5F0E6',
          200: '#E8DCC5', // Secondary brand color
          300: '#DAC8A4',
          400: '#C8B080',
          500: '#B59960',
          600: '#947A46',
        },
        electric: {
          400: '#A78BFA',
          500: '#8B5CF6', // Accent color
          600: '#7C3AED',
          700: '#6D28D9',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      boxShadow: {
        'glass': '0 8px 32px 0 rgba(7, 21, 17, 0.37)',
        'glass-hover': '0 12px 40px 0 rgba(7, 21, 17, 0.55)',
        'glow-purple': '0 0 25px -5px rgba(139, 92, 246, 0.4)',
        'glow-forest': '0 0 25px -5px rgba(23, 63, 53, 0.5)',
      },
      backdropBlur: {
        xs: '2px',
      }
    },
  },
  plugins: [],
}
