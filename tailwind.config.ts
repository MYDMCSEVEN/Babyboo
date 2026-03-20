import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'baby-pink': '#F8E8E0',
        'baby-beige': '#F5F0EB',
        'baby-brown': '#C4A882',
        'baby-cream': '#FFF8F0',
        'baby-sage': '#D4DEAD',
        'baby-rose': '#E8B4B8',
        'baby-text': '#5C4033',
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'sans-serif'],
        serif: ['var(--font-playfair)', 'serif'],
      },
    },
  },
  plugins: [],
}
export default config
