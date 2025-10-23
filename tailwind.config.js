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
        'rosa-primary': '#7e8771',
        'rosa-primaryText': '#c1ca7f',       // Verde claro principal
        'rosa-secondary': '#7e8771',    // Verde oliva oscuro
        'rosa-accent': '#ffffffff',       // Verde intermedio
        'rosa-dark': '#4a5f3a',         // Verde muy oscuro para textos
        'rosa-light': '#ffffffff',        // Verde muy claro para fondos
        
        // Gradientes
        'rosa-gradient-start': '#ffffffff',
        'rosa-gradient-end': '#ffffffff',
      },
      backgroundImage: {
        'rosa-gradient': 'linear-gradient(135deg, #ffffffff 0%, #ffffffff 100%)',
        'rosa-gradient-soft': 'linear-gradient(135deg, #ffffffff 0%, #ffffffff 100%)',
      },
      fontFamily: {
        'display': ['Georgia', 'serif'],
        'body': ['Inter', 'system-ui', 'sans-serif'],
      }
    },
  },
  plugins: [],
}