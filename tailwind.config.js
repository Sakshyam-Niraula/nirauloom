/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  darkMode: 'class',
  theme: { extend: {
    colors: {
      forest: {950:'#F7F6F2',900:'#EFEEE9',850:'#E7E6E0',800:'#414EE8',700:'#343FC9',600:'#5964EC',500:'#7B84F4',400:'#A6ACFF'},
      sand: {50:'#FFFFFF',100:'#F9F8F5',200:'#E8E6DF',300:'#D0CEC7',400:'#AAA8A1',500:'#777681',600:'#292B40'},
      electric: {400:'#FF9B87',500:'#FF8068',600:'#EA684F',700:'#C94D3C'}
    },
    fontFamily: {sans:['DM Sans','Plus Jakarta Sans','system-ui','sans-serif']},
    boxShadow: {'glass':'0 8px 32px rgba(49,54,110,.07)','glass-hover':'0 12px 40px rgba(49,54,110,.12)','glow-purple':'0 0 25px -5px rgba(65,78,232,.25)','glow-forest':'0 0 25px -5px rgba(65,78,232,.2)'},
    backdropBlur:{xs:'2px'}
  }},
  plugins: [],
}
