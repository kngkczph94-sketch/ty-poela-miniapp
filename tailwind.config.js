/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      colors: {
        cream: '#F7F3E8',
        card: '#FAF7EF',
        earth: '#92735C',
        olive: '#686F12',
        'olive-dark': '#30360E',
        ghee: '#E2D4B9',
        butter: '#E2D4B9',
        'butter-soft': '#E2D4B9',
        'warm-dark': '#30360E',
      },
      boxShadow: {
        soft: '0 18px 45px rgba(48, 54, 14, 0.10)',
      },
    },
  },
  plugins: [],
};
