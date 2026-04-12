/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        surface: '#f8fafc',             // Slate 50
        'surface-container-low': '#ffffff',
        'surface-container': '#f1f5f9',     // Slate 100
        'surface-container-high': '#e2e8f0',// Slate 200
        'surface-variant': 'rgba(255, 255, 255, 0.85)',
        primary: '#3b82f6',                 // Blue 500
        'primary-dim': '#2563eb',           // Blue 600
        'primary-container': '#eff6ff',     // Blue 50
        'on-primary': '#ffffff',
        'on-surface': '#0f172a',            // Slate 900
        outline: '#94a3b8',                 // Slate 400
        'outline-variant': '#e2e8f0',       // Slate 200
        error: '#ef4444',                   // Red 500
        'error-container': '#fef2f2',       // Red 50
        success: '#10b981',                 // Emerald 500
        'success-container': '#ecfdf5',     // Emerald 50
        warning: '#f59e0b',                 // Amber 500
        'warning-container': '#fffbeb',     // Amber 50
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      boxShadow: {
        'soft': '0 4px 20px -2px rgba(15, 23, 42, 0.05)',
        'float': '0 10px 40px -5px rgba(15, 23, 42, 0.08)',
      },
      borderRadius: {
        'xl': '0.75rem',
        '2xl': '1rem',
        '3xl': '1.5rem',
      },
      gridTemplateColumns: {
        'catalog': 'repeat(auto-fill, minmax(300px, 1fr))',
      }
    },
  },
  plugins: [],
}
