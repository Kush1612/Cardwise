/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: '#0A3A4A',
        accent: '#D97706',
        soft: '#F3F4F6',
      },
      fontFamily: {
        display: ['Poppins', 'sans-serif'],
        body: ['Manrope', 'sans-serif'],
      },
      boxShadow: {
        card: '0 10px 25px rgba(10,58,74,0.08)',
      },
    },
  },
  plugins: [],
};
