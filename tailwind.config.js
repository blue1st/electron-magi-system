/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        magi: {
          bg: '#08090c',
          card: '#0f1218',
          cardBorder: '#1a202c',
          orange: '#ff6b00',
          orangeGlow: 'rgba(255, 107, 0, 0.4)',
          red: '#ff2a2a',
          redGlow: 'rgba(255, 42, 42, 0.4)',
          green: '#00ff66',
          greenGlow: 'rgba(0, 255, 102, 0.3)',
          yellow: '#ffcc00',
          cyan: '#00e5ff',
          melchior: '#ff7700',
          balthasar: '#00e5ff',
          caspar: '#ff0055'
        }
      },
      fontFamily: {
        mono: ['"Share Tech Mono"', '"JetBrains Mono"', 'Consolas', 'monospace'],
        sans: ['"Inter"', 'system-ui', 'sans-serif'],
      },
      backgroundImage: {
        'hex-pattern': "radial-gradient(circle at 50% 50%, rgba(255, 107, 0, 0.05) 0%, transparent 60%)",
      }
    },
  },
  plugins: [],
}
