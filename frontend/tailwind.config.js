/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Cognitive-friendly color palette
        mint: '#A8E6CF',
        'soft-blue': '#89CFF0',
        'pale-yellow': '#FFF9C4',
        lavender: '#E0BBE4',
        peach: '#FFD3B6',

        // Backgrounds
        'bg-primary': '#FAFBFC',
        'bg-glass': 'rgba(255, 255, 255, 0.7)',

        // Text
        'text-primary': '#2C3E50',
        'text-secondary': '#7F8C8D',

        // Status colors
        'risk-low': '#4CAF50',
        'risk-moderate': '#FF9800',
        'risk-high': '#F44336',
      },
      fontFamily: {
        // OpenDyslexic font with fallbacks
        sans: ['OpenDyslexic', 'Comic Sans MS', 'Arial', 'sans-serif'],
        body: ['OpenDyslexic', 'Comic Sans MS', 'Arial', 'sans-serif'],
      },
      fontSize: {
        base: '18px',
        'xl': '24px',
        'label': '16px',
      },
      lineHeight: {
        relaxed: '1.8',
      },
      borderRadius: {
        'glass': '20px',
      },
      backdropBlur: {
        'glass': '10px',
      },
      boxShadow: {
        'glass': '0 8px 32px rgba(31, 38, 135, 0.15)',
        'glass-hover': '0 12px 40px rgba(31, 38, 135, 0.25)',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.5s ease-out',
        'scale-in': 'scaleIn 0.3s ease-out',
        'shake': 'shake 0.5s ease-in-out',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.9)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        shake: {
          '0%, 100%': { transform: 'translateX(0)' },
          '10%, 30%, 50%, 70%, 90%': { transform: 'translateX(-5px)' },
          '20%, 40%, 60%, 80%': { transform: 'translateX(5px)' },
        },
      },
    },
  },
  plugins: [],
}
