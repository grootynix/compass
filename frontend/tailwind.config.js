/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        compass: {
          bg: '#0F0F14',
          surface: '#1A1A24',
          border: '#2A2A3A',
          accent: '#7C6FCD',
          'accent-bright': '#A89EE0',
          text: '#E8E6F0',
          muted: '#8A8799',
          success: '#5BBFA0',
          warning: '#E8A45A',
        },
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
