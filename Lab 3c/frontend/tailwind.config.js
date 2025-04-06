/** @type {import('tailwindcss').Config} */
export default {
    content: [
      "./index.html",
      "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
      extend: {
        animation: {
          'fade-in': 'fadeIn 0.4s ease-in-out',
        },
        keyframes: {
          fadeIn: {
            '0%': { opacity: 0 },
            '100%': { opacity: 1 },
          },
        },
        colors: {
          // Optional: Extend custom bright color names if needed
          brightPink: '#ff4f87',
          vibrantBlue: '#3b82f6',
          neonGreen: '#32ff7e',
        },
      },
    },
    plugins: [],
  }
  