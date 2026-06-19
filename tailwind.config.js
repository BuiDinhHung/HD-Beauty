/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#A78BFA',
          50: '#F5F3FF',
          100: '#EDE9FE',
          200: '#DDD6FE',
          300: '#C4B5FD',
          400: '#A78BFA',
          500: '#8B5CF6',
          600: '#7C3AED',
          700: '#6D28D9',
          800: '#5B21B6',
          900: '#4C1D95',
        },
        secondary: {
          DEFAULT: '#D8B4FE',
          50: '#FAF5FF',
          100: '#F3E8FF',
          200: '#E9D5FF',
          300: '#D8B4FE',
          400: '#C084FC',
          500: '#A855F7',
        },
        mint: {
          DEFAULT: '#A7F3D0',
          50: '#ECFDF5',
          100: '#D1FAE5',
          200: '#A7F3D0',
          300: '#6EE7B7',
          400: '#34D399',
          500: '#10B981',
        },
        beauty: {
          pink: '#FBC8D4',
          rose: '#F9A8B8',
          gold: '#F7C59F',
          cream: '#FFF8F0',
        },
      },
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', 'SF Pro Display', 'Segoe UI', 'sans-serif'],
      },
      borderRadius: {
        '4xl': '2rem',
        '5xl': '2.5rem',
      },
      backdropBlur: {
        xs: '2px',
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'slide-down': 'slideDown 0.3s ease-out',
        'scale-in': 'scaleIn 0.2s ease-out',
        'bounce-soft': 'bounceSoft 0.5s ease-out',
        shimmer: 'shimmer 2s linear infinite',
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
        slideDown: {
          '0%': { transform: 'translateY(-20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.9)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        bounceSoft: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-8px)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
      boxShadow: {
        glass: '0 8px 32px 0 rgba(167, 139, 250, 0.15)',
        'glass-lg': '0 20px 60px 0 rgba(167, 139, 250, 0.2)',
        card: '0 2px 20px 0 rgba(0, 0, 0, 0.06)',
        'card-hover': '0 8px 30px 0 rgba(167, 139, 250, 0.25)',
        inner: 'inset 0 2px 4px 0 rgba(0,0,0,0.06)',
      },
      backgroundImage: {
        'gradient-beauty': 'linear-gradient(135deg, #A78BFA 0%, #D8B4FE 50%, #A7F3D0 100%)',
        'gradient-primary': 'linear-gradient(135deg, #A78BFA 0%, #8B5CF6 100%)',
        'gradient-soft': 'linear-gradient(135deg, #F5F3FF 0%, #FAF5FF 100%)',
        shimmer: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.6), transparent)',
      },
    },
  },
  plugins: [],
};
