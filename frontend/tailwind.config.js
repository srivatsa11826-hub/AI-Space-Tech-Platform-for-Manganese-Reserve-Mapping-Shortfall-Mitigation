/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        moil: {
          dark: '#0f172a',
          amber: '#f59e0b',
          emerald: '#10b981',
          rose: '#f43f5e',
          purple: '#8b5cf6',
          slate: '#1e293b'
        }
      },
    },
  },
  plugins: [],
}
