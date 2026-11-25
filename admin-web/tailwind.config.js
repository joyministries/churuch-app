/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eaf4fa',
          100: '#d6e8f4',
          200: '#ade1eb',
          300: '#7fc4e0',
          400: '#4db0d7',
          500: '#2c97c5',
          600: '#1b6f94',
          700: '#165673',
          800: '#154459',
          900: '#143949',
        },
        gray: {
          50: '#faf8f5',
          100: '#f3f2ed',
          200: '#e7e2d8',
          300: '#d6d0c5',
          400: '#b3a99c',
          500: '#8c8275',
          600: '#6b6358',
          700: '#4a433a',
          800: '#3d3630',
          900: '#342e27',
        },
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'system-ui', 'sans-serif'],
        serif: ['Instrument Serif', 'Georgia', 'serif'],
      },
    },
  },
  plugins: [],
};