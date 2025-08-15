// tailwind.config.js
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        'cyner-blue': '#2B4C6F',
        'cyner-teal': '#20B2AA',
        'cyner-red': '#DC2626',
        'cyner-gray': '#374151',
      }
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography'),
  ],
}