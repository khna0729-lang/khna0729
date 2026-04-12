/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#0062FF',
        'primary-dark': '#0050D0',
      },
    },
  },
  plugins: [],
}
