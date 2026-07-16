/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: "#ff4d4d", // Un rosso/arancio vivace per il tasto prenota, cambialo a tuo piacimento
      }
    },
  },
  plugins: [],
}