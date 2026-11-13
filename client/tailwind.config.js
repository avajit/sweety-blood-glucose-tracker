/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        // Sweety Approved Brand Identity (Fixed Single Theme)
        brand: {
          deep: '#195A5F',       // Primary actions, headings, active pills
          care: '#128B80',       // Interactive highlights, secondary accents
          coral: '#D0976C',      // Small decorative accents, high glucose tint
          warm: '#F3EDE6',       // Main page canvas background
          white: '#FFFFFF',      // Main content surfaces
          muted: '#EAE3DB',      // Secondary groupings, dividers, borders
          text: '#0F3336',       // Headings and primary text
          textMuted: '#4D6B6D',  // Secondary labels and metadata
        },
        // Accessible Clinical Status Palette
        clinical: {
          target: '#1B6B2E',
          targetBg: '#EBF7EE',
          low: '#92400E',
          lowBg: '#FEF3C7',
          critical: '#991B1B',
          criticalBg: '#FEE2E2',
          high: '#9A3412',
          highBg: '#FFEDD5',
        },
      },
      fontFamily: {
        serif: ['Georgia', '"Source Serif 4"', 'serif'],
        sans: [
          '-apple-system',
          'BlinkMacSystemFont',
          '"Segoe UI"',
          'Roboto',
          '"Helvetica Neue"',
          'Arial',
          'sans-serif',
        ],
      },
      borderRadius: {
        lg: '8px',
        md: '6px',
        sm: '4px',
        xl: '12px',
        pill: '9999px',
      },
      boxShadow: {
        subtle: '0 1px 3px 0 rgba(25, 90, 95, 0.05), 0 1px 2px -1px rgba(25, 90, 95, 0.05)',
        card: '0 2px 6px 0 rgba(25, 90, 95, 0.04)',
      },
    },
  },
  plugins: [],
};
