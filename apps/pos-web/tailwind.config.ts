import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#eff6ff',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
        },
      },
      // Responsive grid for the POS product panel
      gridTemplateColumns: {
        'pos-sm': 'repeat(2, minmax(0, 1fr))',
        'pos-md': 'repeat(3, minmax(0, 1fr))',
        'pos-lg': 'repeat(4, minmax(0, 1fr))',
      },
    },
  },
  plugins: [],
};

export default config;
