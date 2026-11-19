/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        dark: {
          bg: '#0a0e17',
          surface: '#101726',
          card: '#151e32',
          cardHover: '#1b2640',
          input: '#0d1321',
          border: '#1e293b',
          borderHover: '#334155'
        },
        brand: {
          blue: '#2563eb',
          blueHover: '#1d4ed8',
          cyan: '#06b6d4',
          cyanGlow: '#38bdf8'
        }
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      }
    },
  },
  plugins: [],
}
