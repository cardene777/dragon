import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/**/*.{astro,html,ts,tsx,mdx}",
    "../../packages/**/src/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        nm: {
          bg: "#E0D5C8",
          surface: "#E8DDD0",
          "surface-dark": "#D4C9BC",
          text: "#3D3229",
          "text-secondary": "#6B5E52",
          "text-muted": "#9A8D80",
          accent: "#C17F3E",
          "accent-hover": "#A86A2F",
          "accent-light": "#D4A06A",
          teal: "#4A8B7F",
          "teal-hover": "#3D7369",
          "teal-light": "#6BA89E",
          "shadow-light": "#F5EDE3",
          "shadow-dark": "#C4B9AC",
          success: "#6B9E5A",
          "success-bg": "#E8EFE4",
          "success-text": "#3D5E30",
          error: "#C15A4A",
          "error-bg": "#F0E0DC",
          "error-text": "#8A3A2E",
          warning: "#C9A23E",
          "warning-bg": "#F0EADC",
          "warning-text": "#7A6220",
          info: "#5A8EC1",
          "info-bg": "#DDE8F0",
          "info-text": "#2E5A8A",
        },
        primary: {
          50: "#FBF0E4",
          100: "#F5DDC4",
          200: "#E8C49A",
          300: "#D4A06A",
          400: "#C17F3E",
          500: "#A86A2F",
          600: "#8E5826",
          700: "#74471E",
          800: "#5A3717",
          900: "#3D2610",
          950: "#2A1A0B",
        },
      },
      fontFamily: {
        sans: ["Outfit", "system-ui", "-apple-system", "Hiragino Sans", "sans-serif"],
        mono: ["'Fira Code'", "Menlo", "monospace"],
      },
      boxShadow: {
        "nm-raised":
          "6px 6px 12px var(--nm-shadow-dark, #C4B9AC), -6px -6px 12px var(--nm-shadow-light, #F5EDE3)",
        "nm-raised-sm":
          "3px 3px 6px var(--nm-shadow-dark, #C4B9AC), -3px -3px 6px var(--nm-shadow-light, #F5EDE3)",
        "nm-pressed":
          "inset 3px 3px 6px var(--nm-shadow-dark, #C4B9AC), inset -3px -3px 6px var(--nm-shadow-light, #F5EDE3)",
        "nm-pressed-sm":
          "inset 2px 2px 4px var(--nm-shadow-dark, #C4B9AC), inset -2px -2px 4px var(--nm-shadow-light, #F5EDE3)",
        "nm-flat":
          "2px 2px 5px var(--nm-shadow-dark, #C4B9AC), -2px -2px 5px var(--nm-shadow-light, #F5EDE3)",
      },
      borderRadius: {
        nm: "16px",
        "nm-sm": "12px",
      },
      keyframes: {
        "nm-pulse": {
          "0%, 100%": { boxShadow: "3px 3px 6px #C4B9AC, -3px -3px 6px #F5EDE3" },
          "50%": { boxShadow: "1px 1px 3px #C4B9AC, -1px -1px 3px #F5EDE3" },
        },
        "fade-in": {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        "nm-pulse": "nm-pulse 2s ease-in-out infinite",
        "fade-in": "fade-in 0.4s ease-out",
      },
    },
  },
  plugins: [],
};

export default config;
