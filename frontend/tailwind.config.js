// frontend/tailwind.config.js
/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        terra: {
          dark:    '#1a2e1a',
          forest:  '#2d5a3d',
          medium:  '#4a7c59',
          light:   '#7ec87a',
          gold:    '#d4a843',
          bg:      '#f5f7f0',
          surface: '#ffffff',
          border:  '#e0e8d8',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
