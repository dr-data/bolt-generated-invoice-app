/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        emerald: {
          50: '#f0fdf4',
          500: '#10b981',
          600: '#059669',
        },
      },
      maxWidth: {
        '1024': '1024px',
      },
      minWidth: {
        '768': '768px',
      },
      scale: {
        '98': '0.98',
      },
    },
  },
  plugins: [],
}
