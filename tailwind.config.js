/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      colors: {
        cream: '#F8F4EA',
        olive: '#7A8450',
        'olive-dark': '#5E6738',
        ghee: '#E9D7A5',
        butter: '#F4E8BE',
        'butter-soft': '#FBF3D8',
        'warm-dark': '#4B4636',
      },
      boxShadow: {
        soft: '0 18px 45px rgba(75, 70, 54, 0.10)',
      },
    },
  },
  plugins: [],
};
