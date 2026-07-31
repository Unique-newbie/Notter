/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#09090b",
        foreground: "#f4f4f5",
        card: {
          DEFAULT: "#121218",
          foreground: "#f4f4f5",
          hover: "#1a1a24"
        },
        popover: {
          DEFAULT: "#121218",
          foreground: "#f4f4f5",
        },
        primary: {
          DEFAULT: "#7c3aed",
          hover: "#6d28d9",
          foreground: "#ffffff",
          glow: "rgba(124, 58, 237, 0.15)"
        },
        secondary: {
          DEFAULT: "#1e1e2a",
          foreground: "#a1a1aa",
          hover: "#272738"
        },
        muted: {
          DEFAULT: "#181820",
          foreground: "#8e8ea0",
        },
        accent: {
          DEFAULT: "#8b5cf6",
          foreground: "#ffffff",
        },
        destructive: {
          DEFAULT: "#ef4444",
          foreground: "#ffffff",
        },
        border: "#232334",
        input: "#1e1e2a",
        ring: "#7c3aed",
      },
      borderRadius: {
        lg: "0.75rem",
        md: "0.5rem",
        sm: "0.375rem",
      },
      fontFamily: {
        sans: ["Inter", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "Roboto", "sans-serif"],
        mono: ["JetBrains Mono", "Fira Code", "monospace"],
      },
      boxShadow: {
        purple: "0 0 20px -5px rgba(124, 58, 237, 0.3)",
        "purple-lg": "0 0 35px -5px rgba(124, 58, 237, 0.4)",
        glass: "0 8px 32px 0 rgba(0, 0, 0, 0.37)",
      }
    },
  },
  plugins: [],
};
