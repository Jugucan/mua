/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      // NOU: Definim Montserrat com la font 'sans' per defecte de Tailwind
      fontFamily: {
        'sans': ['Montserrat', 'sans-serif'],
      }
      // FI NOU
    },
  },
  plugins: [],
}
