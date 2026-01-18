/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#3B82F6',
        secondary: '#64748B',
        danger: '#EF4444',
        dark: {
          bg: '#1a1a1a',
          surface: '#262626',
          border: '#404040',
          text: {
            primary: '#e5e5e5',
            secondary: '#a3a3a3'
          }
        }
      },
    },
  },
  plugins: [],
}
