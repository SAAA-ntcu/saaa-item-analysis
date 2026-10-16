/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        morandi: {
          primary: '#52796f',
          'primary-dark': '#354f52',
          'primary-light': '#edf2ee',
          terracotta: '#c47c5d',
          coral: '#e07a5f',
          oat: '#d4a373',
          apricot: '#e9c46a',
          rose: '#c87d8a',
          sage: '#7ea172',
          slate: '#2f3e46',
          'cover-from': '#729289',
          'cover-to': '#5f7e76'
        }
      }
    },
  },
  plugins: [],
}
