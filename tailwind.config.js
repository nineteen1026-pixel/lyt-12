/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        pixel: ['"Press Start 2P"', 'monospace'],
      },
      colors: {
        'farm': {
          'grass': '#7cb342',
          'grass-spring': '#aed581',
          'grass-summer': '#558b2f',
          'grass-autumn': '#f9a825',
          'grass-winter': '#e0e0e0',
          'soil': '#8d6e63',
          'soil-dark': '#6d4c41',
          'soil-wet': '#4e342e',
          'wood': '#8d6e63',
          'wood-dark': '#5d4037',
          'ui': '#fff8e1',
          'ui-dark': '#ffe082',
          'ui-border': '#8d6e63',
          'gold': '#ffd54f',
          'gold-dark': '#ffb300',
        }
      },
      boxShadow: {
        'pixel': '4px 4px 0px 0px #5d4037',
        'pixel-sm': '2px 2px 0px 0px #5d4037',
        'pixel-inset': 'inset 2px 2px 0px 0px #5d4037, inset -2px -2px 0px 0px #ffe082',
      }
    },
  },
  plugins: [],
}
