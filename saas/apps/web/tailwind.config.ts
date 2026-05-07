import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{js,ts,jsx,tsx}', './components/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: '#4f46e5',
        secondary: '#22c55e',
        surface: '#0f172a'
      },
      boxShadow: {
        soft: '0 20px 80px rgba(15, 23, 42, 0.12)'
      }
    }
  },
  plugins: []
};

export default config;
