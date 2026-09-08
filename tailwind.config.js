/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: '#0A0A0A',
        paper: '#FFFFFF',
        ember: '#D91F2C',
        'ember-deep': '#8F1019',
        'ember-tint': '#FBEAEA',
        smoke: '#F5F5F4',
        steel: '#5B5B58',
        'steel-soft': '#8A8A86',
        line: '#E7E5E3',
        brand: {
          50: '#fef2f2',
          100: '#fee2e2',
          200: '#fecaca',
          500: '#D91F2C',
          600: '#b91c1c',
          700: '#8F1019',
          800: '#7f1d1d',
          900: '#450a0a',
        }
      },
      fontFamily: {
        display: ['Oswald', 'sans-serif'],
        body: ['Inter', 'sans-serif']
      }
    },
  },
  plugins: [],
}
