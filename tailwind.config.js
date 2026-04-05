/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class', // ← INDISPENSABLE pour le dark/light mode
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Vos couleurs actuelles (noir/rouge)
        skull: {
          dark: '#0a0a0a',
          red: '#ef4444',
          gray: '#1f2937',
        },
        // Couleurs light mode (blanc/rouge)
        light: {
          bg: '#f8fafc',
          text: '#0f172a',
        }
      }
    },
  },
  plugins: [],
}