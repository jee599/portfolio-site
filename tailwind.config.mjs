/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: '#ffffff',
        surface: '#f9fafb',
        border: '#f2f4f6',
        muted: '#8b95a1',
        text: '#333d4b',
        heading: '#191f28',
        accent: '#00c471',
        'accent-light': '#e6f9f0',
        'accent-dark': '#00a85e',
        success: '#10b981',
        warning: '#f59e0b',
        danger: '#ef4444',
      },
      fontFamily: {
        display: ['"IBM Plex Sans KR"', 'sans-serif'],
        body: ['"IBM Plex Sans KR"', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
    },
  },
  plugins: [],
};
