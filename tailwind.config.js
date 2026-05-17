/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        display: ['"Cormorant Garamond"', 'serif'],
        body: ['"Be Vietnam Pro"', 'sans-serif'],
        urdu: ['"Noto Nastaliq Urdu"', 'serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      colors: {
        ink: '#1a1614',
        parchment: '#f5f0e8',
        cream: '#faf6ee',
        sage: '#6b7a5a',
        terracotta: '#b85c3a',
        gold: '#a8884b',
        deep: '#2d3a2e',
      },
      boxShadow: {
        soft: '0 4px 20px -8px rgba(26, 22, 20, 0.15)',
        card: '0 8px 32px -12px rgba(26, 22, 20, 0.2)',
        deep: '0 20px 60px -20px rgba(26, 22, 20, 0.4)',
      },
    },
  },
  plugins: [],
};
