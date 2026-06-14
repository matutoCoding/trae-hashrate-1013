/** @type {import('tailwindcss').Config} */

export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    container: {
      center: true,
    },
    extend: {
      colors: {
        navy: {
          50: '#f0f4fa',
          100: '#d9e2ef',
          200: '#b5c6df',
          300: '#87a2c8',
          400: '#5579ab',
          500: '#355a90',
          600: '#264775',
          700: '#1f395e',
          800: '#1a2f4d',
          900: '#0F1B2D',
          950: '#09101c',
        },
        safety: {
          red: '#E63946',
          orange: '#F4A261',
          green: '#2A9D8F',
          gold: '#E9C46A',
        }
      },
      fontFamily: {
        display: ['"Playfair Display"', 'serif'],
        sans: ['"Noto Sans SC"', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'glow-gold': '0 0 20px rgba(233, 196, 106, 0.4)',
        'glow-red': '0 0 20px rgba(230, 57, 70, 0.5)',
        'glow-green': '0 0 15px rgba(42, 157, 143, 0.4)',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'danger-pulse': 'danger-pulse 1.5s ease-in-out infinite',
        'float': 'float 4s ease-in-out infinite',
      },
      keyframes: {
        'danger-pulse': {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(230, 57, 70, 0.6)' },
          '50%': { boxShadow: '0 0 0 12px rgba(230, 57, 70, 0)' },
        },
        'float': {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-6px)' },
        }
      }
    },
  },
  plugins: [],
};
