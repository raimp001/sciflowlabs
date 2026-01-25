import type { Config } from "tailwindcss";

/**
 * SciFlow Tailwind Configuration
 *
 * Design System: Claude.ai Aesthetic
 * - Warm, approachable, and professional
 * - Generous whitespace with soft shadows
 * - Sophisticated yet friendly color palette
 *
 * Color Philosophy:
 * - Coral/terracotta for primary actions and highlights
 * - Warm cream backgrounds for comfort
 * - Sage green for verified/success states
 * - Muted reds for alerts (sophisticated, not alarming)
 * - Charcoal for authoritative text
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
        // CLAUDE.AI INSPIRED BRAND COLORS
        // ========================================

        // Coral/Terracotta - Primary accent, CTAs, highlights
        coral: {
          DEFAULT: '#D97757',
          50: '#FEF6F4',
          100: '#FCE8E3',
          200: '#F9D1C7',
          300: '#F4B3A1',
          400: '#EC9279',
          500: '#D97757', // Primary - Claude coral
          600: '#C45F3F',
          700: '#A34932',
          800: '#7D3826',
          900: '#5A291D',
          950: '#3A1A12',
        },

        // Cream/Beige - Background tones, warmth
        cream: {
          DEFAULT: '#FAF8F5',
          50: '#FFFFFF',
          100: '#FDF9F6',
          200: '#FAF8F5', // Primary - warm cream
          300: '#F4EFE9',
          400: '#EAE3D9',
          500: '#DDD4C7',
          600: '#C7BAA8',
          700: '#A99A84',
          800: '#847766',
          900: '#5F554A',
          950: '#3D362F',
        },

        // Sage Green - Verified, safe, success, completed
        sage: {
          DEFAULT: '#4A9B6B',
          50: '#F0F7F3',
          100: '#DCEFE3',
          200: '#B8DFC6',
          300: '#8BCAA3',
          400: '#5FB37F',
          500: '#4A9B6B', // Primary - muted sage
          600: '#3C7D56',
          700: '#316345',
          800: '#284D38',
          900: '#1F3A2B',
          950: '#12241A',
        },

        // Charcoal - Text, headers, dark elements
        charcoal: {
          DEFAULT: '#1F1D1B',
          50: '#F5F5F4',
          100: '#E5E5E4',
          200: '#CBCBC9',
          300: '#A8A7A4',
          400: '#7C7A76',
          500: '#5E5C58',
          600: '#4A4846',
          700: '#3A3836',
          800: '#2A2826',
          900: '#1F1D1B', // Primary - charcoal
          950: '#0F0E0D',
        },

        // Alert Red - Disputes, errors (sophisticated, not alarming)
        alert: {
          DEFAULT: '#C65D5D',
          50: '#FDF5F5',
          100: '#FBE8E8',
          200: '#F6D1D1',
          300: '#EFB0B0',
          400: '#E48585',
          500: '#C65D5D', // Primary - muted red
          600: '#A94848',
          700: '#893939',
          800: '#692D2D',
          900: '#4D2222',
          950: '#2E1414',
        },

        // Amber - Warnings, pending states
        amber: {
          DEFAULT: '#E5A84B',
          50: '#FEF9F0',
          100: '#FCF0DB',
          200: '#F9E0B5',
          300: '#F5CC88',
          400: '#EFB65B',
          500: '#E5A84B', // Primary - warm amber
          600: '#CC8F32',
          700: '#A67128',
          800: '#7D5520',
          900: '#573B17',
          950: '#35230E',
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
      // BOX SHADOW (Soft, warm, Claude-style)
      // ========================================
      boxShadow: {
        'soft': '0 1px 3px 0 rgb(31 29 27 / 0.04), 0 1px 2px -1px rgb(31 29 27 / 0.04)',
        'soft-md': '0 4px 6px -1px rgb(31 29 27 / 0.06), 0 2px 4px -2px rgb(31 29 27 / 0.04)',
        'soft-lg': '0 10px 15px -3px rgb(31 29 27 / 0.08), 0 4px 6px -4px rgb(31 29 27 / 0.04)',
        'soft-xl': '0 20px 25px -5px rgb(31 29 27 / 0.10), 0 8px 10px -6px rgb(31 29 27 / 0.05)',
        'card-hover': '0 8px 30px rgb(31 29 27 / 0.12)',
        'coral-glow': '0 0 20px rgb(217 119 87 / 0.25)',
        'sage-glow': '0 0 20px rgb(74 155 107 / 0.25)',
        'amber-glow': '0 0 20px rgb(229 168 75 / 0.25)',
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
