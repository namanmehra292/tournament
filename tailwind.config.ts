import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        glass: {
          bg: "rgba(255,255,255,0.10)",
          border: "rgba(255,255,255,0.28)",
          focus: "rgba(255,255,255,0.18)",
        },
        ocean: {
          50: "#eefcfb",
          100: "#d4f6f3",
          200: "#aeece8",
          300: "#79dcd8",
          400: "#45c2c0",
          500: "#2aa3a4",
          600: "#1f8286",
          700: "#1e686e",
          800: "#1e5359",
          900: "#1b454c",
          950: "#0a262c",
        },
      },
      fontFamily: {
        sans: ["Inter", "SF Pro Display", "-apple-system", "sans-serif"],
      },
      backdropBlur: {
        xs: "2px",
      },
      boxShadow: {
        glass: "0 8px 32px 0 rgba(10, 38, 44, 0.25)",
        "glass-sm": "0 4px 16px 0 rgba(10, 38, 44, 0.18)",
        "glow-focus": "0 0 0 3px rgba(69, 194, 192, 0.35)",
      },
      borderRadius: {
        "2.5xl": "1.375rem",
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-14px)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
      },
      animation: {
        float: "float 8s ease-in-out infinite",
        "float-slow": "float 12s ease-in-out infinite",
        shimmer: "shimmer 2.5s linear infinite",
      },
    },
  },
  plugins: [],
};

export default config;
