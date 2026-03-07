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
        accent: '#3182f6',
        'accent-light': '#e8f3ff',
        'accent-dark': '#1b64da',
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
