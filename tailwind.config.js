/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        'mono': ['JetBrains Mono', 'monospace'],
        'orbitron': ['Orbitron', 'sans-serif'],
      },
      animation: {
        'glow': 'glow 1.5s ease-in-out infinite alternate',
        'loading': 'loading 1s linear infinite',
      },
      keyframes: {
        glow: {
          '0%': { textShadow: '0 0 5px currentColor' },
          '100%': { textShadow: '0 0 20px currentColor, 0 0 30px currentColor' },
        },
        loading: {
          '0%': { opacity: '1' },
          '50%': { opacity: '0.5' },
          '100%': { opacity: '1' },
        }
      }
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
}