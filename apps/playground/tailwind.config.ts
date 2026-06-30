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
          bg: "#f5f1e8",
          surface: "#fffdf7",
          "surface-dark": "#ede5d2",
          text: "#1a1f2a",
          "text-secondary": "#5a6270",
          "text-muted": "#8a8678",
          accent: "#2d6a8f",
          "accent-hover": "#1f4d6e",
          "accent-light": "#4e9dc4",
          teal: "#2d6a8f",
          "teal-hover": "#1f4d6e",
          "teal-light": "#4e9dc4",
          "shadow-light": "#fffdf7",
          "shadow-dark": "#e0d9c8",
          success: "#4ea36a",
          "success-bg": "#e8efe4",
          "success-text": "#2d5e3d",
          error: "#c15a4a",
          "error-bg": "#f5e3df",
          "error-text": "#8a3a2e",
          warning: "#c9a23e",
          "warning-bg": "#f5edd9",
          "warning-text": "#7a6220",
          info: "#5a8ec1",
          "info-bg": "#dee8f3",
          "info-text": "#2e5a8a",
        },
        primary: {
          50: "#f0f7fb",
          100: "#dbeaf2",
          200: "#b8d5e5",
          300: "#8ebcd4",
          400: "#5e9dbf",
          500: "#2d6a8f",
          600: "#255778",
          700: "#1f4d6e",
          800: "#19405a",
          900: "#133247",
          950: "#0d2230",
        },
      },
      fontFamily: {
        sans: ["Inter", "-apple-system", "Segoe UI", "Hiragino Sans", "sans-serif"],
        serif: ["Newsreader", "EB Garamond", "Georgia", "serif"],
        mono: ["'JetBrains Mono'", "'SF Mono'", "Menlo", "monospace"],
      },
      boxShadow: {
        "nm-raised":
          "0 1px 0 rgba(255,255,255,0.6) inset, 0 18px 40px -22px rgba(26,31,42,0.12)",
        "nm-raised-sm":
          "0 1px 0 rgba(255,255,255,0.6) inset, 0 8px 20px -8px rgba(26,31,42,0.1)",
        "nm-pressed":
          "inset 0 1px 3px rgba(26,31,42,0.06)",
        "nm-pressed-sm":
          "inset 0 1px 2px rgba(26,31,42,0.05)",
        "nm-flat":
          "0 1px 3px rgba(26,31,42,0.04)",
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
