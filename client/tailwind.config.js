/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        arima: ['Arima', 'sans-serif'],
        PlaywriteGBS: ['Playwrite GB S', 'arima'],
        AfacadFlux: ['Afacad Flux','sans-serif'],
        PTSans: ['PT Sans','sans-serif'],
        RubikWetPaint: ['Rubik Wet Paint', 'sans-serif'],
        Nunito: ['Nunito', 'sans-serif']
      },
    },
  },
  plugins: [],
}
