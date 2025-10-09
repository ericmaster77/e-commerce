// tailwind.config.js - REEMPLAZAR COMPLETO
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Paleta Rosa Oliva
        'rosa-primary': '#c1ca7f',      // Verde claro principal
        'rosa-secondary': '#90983d',    // Verde oliva oscuro
        'rosa-accent': '#b8c26d',       // Verde intermedio
        'rosa-dark': '#4a5f3a',         // Verde muy oscuro para textos
        'rosa-light': '#e8eccd',        // Verde muy claro para fondos
        
        // Gradientes
        'rosa-gradient-start': '#c1ca7f',
        'rosa-gradient-end': '#90983d',
      },
      backgroundImage: {
        'rosa-gradient': 'linear-gradient(135deg, #c1ca7f 0%, #90983d 100%)',
        'rosa-gradient-soft': 'linear-gradient(135deg, #e8eccd 0%, #c1ca7f 100%)',
      },
      fontFamily: {
        'display': ['Georgia', 'serif'],
        'body': ['Inter', 'system-ui', 'sans-serif'],
      }
    },
  },
  plugins: [],
}