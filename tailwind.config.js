/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      colors: {
        primary: '#686F12',
        clay: '#E2D4B9',
        deep: '#30360E',
        earth: '#92735C',
        cream: '#F7F3E8',
        card: '#FAF7EF',
      },
      boxShadow: {
        soft: '0 18px 45px rgba(48, 54, 14, 0.12)',
      },
    },
  },
  plugins: [],
};
