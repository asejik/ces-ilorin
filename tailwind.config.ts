import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        canvas: '#F9FAFB',
        surface: {
          DEFAULT: '#FFFFFF',
          subtle: '#F3F4F6',
        },
        ink: {
          950: '#0B0F19',
          900: '#0F172A',
          800: '#1E293B',
          700: '#334155',
          600: '#475467',
          500: '#64748B',
          400: '#94A3B8',
          200: '#E2E8F0',
          100: '#F1F5F9',
        },
        solar: {
          50: '#FFFBEB',
          100: '#FEF3C7',
          200: '#FDE68A',
          400: '#FBBF24',
          500: '#F59E0B',
          600: '#D97706',
          700: '#B45309',
        },
        sunday: {
          50: '#FFF7ED',
          100: '#FFEDD5',
          200: '#FED7AA',
          500: '#F97316',
          600: '#EA580C',
          700: '#C2410C',
        },
        status: {
          graduate: {
            bg: '#ECFDF5',
            text: '#065F46',
            dot: '#10B981',
          },
          notyet: {
            bg: '#FFF1F2',
            text: '#9F1239',
            dot: '#F43F5E',
          },
          pending: {
            bg: '#FFFBEB',
            text: '#92400E',
            dot: '#F59E0B',
          },
        },
      },
      fontFamily: {
        heading: ['var(--font-outfit)', 'sans-serif'],
        sans: ['var(--font-jakarta)', 'sans-serif'],
        mono: ['var(--font-mono)', 'monospace'],
      },
      boxShadow: {
        xs: '0 1px 2px 0 rgba(11, 15, 25, 0.05)',
        sm: '0 1px 3px 0 rgba(11, 15, 25, 0.08), 0 1px 2px -1px rgba(11, 15, 25, 0.04)',
        md: '0 4px 6px -1px rgba(11, 15, 25, 0.08), 0 2px 4px -2px rgba(11, 15, 25, 0.04)',
        lg: '0 10px 15px -3px rgba(11, 15, 25, 0.08), 0 4px 6px -4px rgba(11, 15, 25, 0.04)',
      },
      borderRadius: {
        sm: '4px',
        md: '8px',
        lg: '12px',
        xl: '16px',
      },
    },
  },
  plugins: [],
};

export default config;
