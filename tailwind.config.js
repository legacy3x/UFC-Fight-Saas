/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#e4032e',
        secondary: '#1a1a1a',
        accent: '#ffd700',
      },
      fontFamily: {
        sans: ['Roboto Condensed', 'system-ui', 'sans-serif'],
        mono: ['Roboto Mono', 'monospace'],
      },
      boxShadow: {
        'card': '0 4px 6px rgba(0, 0, 0, 0.1)',
        'hover': '0 8px 12px rgba(0, 0, 0, 0.15)',
      },
    },
  },
  plugins: [],
}