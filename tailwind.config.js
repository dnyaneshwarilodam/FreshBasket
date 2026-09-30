/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,html}'],
  theme: {
    extend: {
      fontFamily: {
        heading: ['"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
        body: ['Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        brand: {
          DEFAULT: '#0C831F',
          hover: '#0A6E1A',
          tint: '#E8F5EA',
          dark: '#2FBF4A',
        },
        accent: '#F8CB46',
        hot: '#E23744',
        ai: {
          violet: '#7C3AED',
          blue: '#2563EB',
        },
        ink: {
          DEFAULT: '#1C1C1C',
          dark: '#F5F5F5',
        },
        muted: '#6B7280',
        surface: {
          DEFAULT: '#FFFFFF',
          dark: '#121212',
        },
        canvas: {
          DEFAULT: '#F7F7F8',
          dark: '#0B0B0C',
        },
        line: {
          DEFAULT: '#ECECEC',
          dark: '#2A2A2A',
        },
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
        't-3xl': '1.5rem 1.5rem 0 0',
      },
      boxShadow: {
        card: '0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.04)',
        'card-hover': '0 8px 24px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.06)',
        'soft': '0 2px 8px rgba(0,0,0,0.06)',
        'lift': '0 12px 32px rgba(0,0,0,0.14)',
        'ai-glow': '0 0 20px rgba(124,58,237,0.3)',
      },
      maxWidth: {
        content: '1280px',
      },
      fontSize: {
        '2xs': '0.625rem',
      },
      transitionTimingFunction: {
        spring: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
      },
      animation: {
        'fade-up': 'fadeUp 0.5s ease-out forwards',
        'slide-in': 'slideIn 0.3s ease-out forwards',
        'slide-up': 'slideUp 0.35s cubic-bezier(0.34,1.56,0.64,1) forwards',
        'slide-right': 'slideRight 0.35s cubic-bezier(0.34,1.56,0.64,1) forwards',
        'bounce-once': 'bounceOnce 0.5s cubic-bezier(0.34,1.56,0.64,1)',
        'pulse-dot': 'pulseDot 1.5s ease-in-out infinite',
        'shimmer': 'shimmer 1.5s infinite linear',
        'spin-slow': 'spin 3s linear infinite',
        'twinkle': 'twinkle 1.5s ease-in-out infinite',
        'aurora': 'aurora 8s ease-in-out infinite alternate',
        'marquee': 'marquee 30s linear infinite',
        'scan': 'scan 2s ease-in-out infinite',
        'checkmark': 'drawCheck 0.6s ease-out forwards',
        'ring-pulse': 'ringPulse 2s ease-out infinite',
        'waveform': 'waveform 0.8s ease-in-out infinite',
      },
      keyframes: {
        fadeUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideIn: {
          '0%': { opacity: '0', transform: 'translateX(-10px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        slideUp: {
          '0%': { transform: 'translateY(100%)' },
          '100%': { transform: 'translateY(0)' },
        },
        slideRight: {
          '0%': { transform: 'translateX(100%)' },
          '100%': { transform: 'translateX(0)' },
        },
        bounceOnce: {
          '0%': { transform: 'scale(1)' },
          '30%': { transform: 'scale(1.25)' },
          '60%': { transform: 'scale(0.9)' },
          '100%': { transform: 'scale(1)' },
        },
        pulseDot: {
          '0%, 100%': { opacity: '1', transform: 'scale(1)' },
          '50%': { opacity: '0.5', transform: 'scale(0.8)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        twinkle: {
          '0%, 100%': { opacity: '0.2', transform: 'scale(0.8)' },
          '50%': { opacity: '1', transform: 'scale(1.2)' },
        },
        aurora: {
          '0%': { transform: 'translate(0,0) scale(1)', opacity: '0.5' },
          '50%': { transform: 'translate(30px,-20px) scale(1.1)', opacity: '0.7' },
          '100%': { transform: 'translate(-20px,10px) scale(0.95)', opacity: '0.4' },
        },
        marquee: {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-50%)' },
        },
        scan: {
          '0%, 100%': { top: '0%' },
          '50%': { top: '100%' },
        },
        drawCheck: {
          '0%': { strokeDashoffset: '150' },
          '100%': { strokeDashoffset: '0' },
        },
        ringPulse: {
          '0%': { transform: 'scale(0.8)', opacity: '0.8' },
          '100%': { transform: 'scale(2)', opacity: '0' },
        },
        waveform: {
          '0%, 100%': { transform: 'scaleY(0.3)' },
          '50%': { transform: 'scaleY(1)' },
        },
      },
    },
  },
  plugins: [],
}
