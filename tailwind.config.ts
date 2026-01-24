import type { Config } from "tailwindcss";

/**
 * SciFlow Tailwind Configuration
 * 
 * Design System: "Clause" Aesthetic
 * - High-trust, legal-tech professional appearance
 * - Clean, authoritative, and transparent
 * 
 * Color Philosophy:
 * - Navy for authority and trust
 * - Amber for warmth and highlights (variables, amounts)
 * - Sage for verified/safe states
 * - Muted red for alerts (not alarming, but noticeable)
 */

const config: Config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      // ========================================
      // CLAUSE AESTHETIC COLOR PALETTE
      // ========================================
      colors: {
        // Core semantic colors (CSS variable based for theme switching)
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))'
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))'
        },
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))'
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))'
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))'
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))'
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))'
        },
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',

        // ========================================
        // SCIFLOW BRAND COLORS (Direct hex values)
        // ========================================
        
        // Deep Navy - Primary actions, headers, trust
        navy: {
          DEFAULT: '#1A2332',
          50: '#E8EBF0',
          100: '#C5CCD8',
          200: '#9EABBD',
          300: '#7789A1',
          400: '#59708C',
          500: '#3B5877',
          600: '#2D4562',
          700: '#1F334D',
          800: '#1A2332', // Primary
          900: '#0F1520',
          950: '#080A0F',
        },
        
        // Warm Amber - Highlights, variables, amounts, CTAs
        amber: {
          DEFAULT: '#D4A574',
          50: '#FDF8F3',
          100: '#F9EDE0',
          200: '#F2DBBF',
          300: '#E8C59A',
          400: '#D4A574', // Primary
          500: '#C48F5A',
          600: '#AB7542',
          700: '#8B5D35',
          800: '#6B472A',
          900: '#4A3220',
          950: '#2D1E13',
        },
        
        // Sage Green - Verified, safe, success, completed
        sage: {
          DEFAULT: '#7BA05B',
          50: '#F4F7F1',
          100: '#E5EDE0',
          200: '#CBDBBF',
          300: '#ADC69A',
          400: '#8FB275',
          500: '#7BA05B', // Primary
          600: '#628149',
          700: '#4C6439',
          800: '#3A4C2C',
          900: '#283521',
          950: '#171F13',
        },
        
        // Muted Red - Alerts, disputes, errors (non-alarming)
        alert: {
          DEFAULT: '#A53F3F',
          50: '#F8EDED',
          100: '#F0D5D5',
          200: '#E0ABAB',
          300: '#CD7C7C',
          400: '#B85656',
          500: '#A53F3F', // Primary
          600: '#8A3333',
          700: '#6E2929',
          800: '#532020',
          900: '#3A1616',
          950: '#220D0D',
        },

        // Chart colors (matching the palette)
        chart: {
          '1': 'hsl(var(--chart-1))',
          '2': 'hsl(var(--chart-2))',
          '3': 'hsl(var(--chart-3))',
          '4': 'hsl(var(--chart-4))',
          '5': 'hsl(var(--chart-5))'
        },

        // Sidebar (dark theme navigation)
        sidebar: {
          DEFAULT: 'hsl(var(--sidebar-background))',
          foreground: 'hsl(var(--sidebar-foreground))',
          primary: 'hsl(var(--sidebar-primary))',
          'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
          accent: 'hsl(var(--sidebar-accent))',
          'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
          border: 'hsl(var(--sidebar-border))',
          ring: 'hsl(var(--sidebar-ring))'
        }
      },

      // ========================================
      // TYPOGRAPHY
      // ========================================
      fontFamily: {
        // Serif for contract/document text - authoritative, legal feel
        serif: ['Merriweather', 'Georgia', 'Cambria', 'Times New Roman', 'serif'],
        
        // Sans-serif for UI elements - clean, modern, readable
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        
        // Monospace for code, hashes, addresses
        mono: ['JetBrains Mono', 'Fira Code', 'Monaco', 'Consolas', 'Liberation Mono', 'monospace'],
      },

      // ========================================
      // BORDER RADIUS (Subtle, professional)
      // ========================================
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)'
      },

      // ========================================
      // BOX SHADOW (Subtle, layered)
      // ========================================
      boxShadow: {
        'clause': '0 1px 3px 0 rgb(26 35 50 / 0.05), 0 1px 2px -1px rgb(26 35 50 / 0.05)',
        'clause-md': '0 4px 6px -1px rgb(26 35 50 / 0.05), 0 2px 4px -2px rgb(26 35 50 / 0.05)',
        'clause-lg': '0 10px 15px -3px rgb(26 35 50 / 0.05), 0 4px 6px -4px rgb(26 35 50 / 0.05)',
        'clause-xl': '0 20px 25px -5px rgb(26 35 50 / 0.08), 0 8px 10px -6px rgb(26 35 50 / 0.05)',
        'card-hover': '0 8px 30px rgb(26 35 50 / 0.12)',
        'amber-glow': '0 0 20px rgb(212 165 116 / 0.3)',
        'sage-glow': '0 0 20px rgb(123 160 91 / 0.3)',
      },

      // ========================================
      // ANIMATIONS
      // ========================================
      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' }
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' }
        },
        'fade-in': {
          from: { opacity: '0' },
          to: { opacity: '1' }
        },
        'fade-up': {
          from: { opacity: '0', transform: 'translateY(10px)' },
          to: { opacity: '1', transform: 'translateY(0)' }
        },
        'slide-in-right': {
          from: { opacity: '0', transform: 'translateX(20px)' },
          to: { opacity: '1', transform: 'translateX(0)' }
        },
        'pulse-subtle': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.7' }
        },
        'state-transition': {
          '0%': { transform: 'scale(1)', boxShadow: '0 0 0 0 rgb(212 165 116 / 0.4)' },
          '50%': { transform: 'scale(1.02)', boxShadow: '0 0 0 8px rgb(212 165 116 / 0)' },
          '100%': { transform: 'scale(1)', boxShadow: '0 0 0 0 rgb(212 165 116 / 0)' }
        },
        'shimmer': {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' }
        }
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
        'fade-in': 'fade-in 0.3s ease-out',
        'fade-up': 'fade-up 0.4s ease-out',
        'slide-in-right': 'slide-in-right 0.3s ease-out',
        'pulse-subtle': 'pulse-subtle 2s ease-in-out infinite',
        'state-transition': 'state-transition 0.6s ease-out',
        'shimmer': 'shimmer 2s linear infinite',
      },

      // ========================================
      // SPACING (For document-like layouts)
      // ========================================
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '112': '28rem',
        '128': '32rem',
      },

      // ========================================
      // TYPOGRAPHY PLUGIN CONFIG
      // ========================================
      typography: {
        DEFAULT: {
          css: {
            '--tw-prose-body': 'hsl(var(--foreground))',
            '--tw-prose-headings': '#1A2332',
            '--tw-prose-links': '#1A2332',
            '--tw-prose-bold': '#1A2332',
            '--tw-prose-counters': '#7789A1',
            '--tw-prose-bullets': '#7789A1',
            '--tw-prose-hr': '#E8EBF0',
            '--tw-prose-quotes': '#1A2332',
            '--tw-prose-quote-borders': '#D4A574',
            '--tw-prose-captions': '#7789A1',
            '--tw-prose-code': '#1A2332',
            '--tw-prose-pre-code': '#E8EBF0',
            '--tw-prose-pre-bg': '#1A2332',
          },
        },
      },
    }
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
