/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: '#0a0a0f',
        'bg-alt': '#12121a',
        surface: '#1a1a2e',
        'surface-hover': '#222238',
        border: '#2a2a3e',
        muted: '#7a7a9a',
        text: '#c8c8e0',
        heading: '#e8e8f0',
        accent: '#6c63ff',
        'accent-light': 'rgba(108,99,255,0.12)',
        'accent-dark': '#8b83ff',
        'accent-glow': 'rgba(108,99,255,0.25)',
        success: '#10b981',
        warning: '#f59e0b',
        danger: '#ef4444',
        claude: '#d97757',
        gemini: '#4285f4',
        gpt: '#10a37f',
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
