/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: '#ffffff',
        surface: '#f9fafb',
        border: '#e5e7eb',
        muted: '#6b7280',
        text: '#1f2937',
        heading: '#030712',
        accent: '#10b981',
        'accent-light': '#ecfdf5',
        'accent-dark': '#059669',
        success: '#10b981',
        warning: '#f59e0b',
        danger: '#ef4444',
      },
      fontFamily: {
        display: ['"DM Sans"', 'sans-serif'],
        body: ['"IBM Plex Sans"', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
    },
  },
  plugins: [],
};
