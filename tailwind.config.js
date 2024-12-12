/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{html,js}"],
  theme: {
    fontSize: {
      sm: '0.8rem',
      base: '1rem',
      xl: '1.25rem',
      '2xl': '1.563rem',
      '3xl': '1.953rem',
      '4xl': '2.441rem',
      '5xl': '3.052rem',
    },
    screens: {
      xs: '370px',
      sm: '640px',
      md: '768px',
    },
    extend: {
      fontFamily: {
        custom: ['"Rubik Dirt"', 'sans-serif'],
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography'),
    require('tailwindcss-filters'),
    require('tailwind-scrollbar')
  ],
  variants: {
    scrollbar: ['rounded']
  }
}

