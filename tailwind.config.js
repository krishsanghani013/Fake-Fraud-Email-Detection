/** @type {import('tailwindcss').Config} */
const config = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,jsx,mdx}",
    "./src/components/**/*.{js,jsx,mdx}",
    "./src/app/**/*.{js,jsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Aegis Design System Core Tokens
        deepSlate: "#0F172A",
        accentBlue: "#3B82F6",
        accentBlueHover: "#2563EB",
        softWhite: "#FAFBFC",
        neutralGray: "#64748B",
        borderSubtle: "rgb(var(--border-subtle-rgb) / <alpha-value>)",
        borderLight: "rgb(var(--border-subtle-rgb) / <alpha-value>)",

        // Semantic Risk Level Colors
        riskLow: "#10B981",
        riskMedium: "#F59E0B",
        riskHigh: "#EF4444",
        riskCritical: "#7C3AED",

        // Data Visualization Neutrals
        vizSuccess: "#06B6D4",
        vizWarning: "#FBBF24",
        vizError: "#DC2626",
        vizInfo: "#06B6D4",

        // Legacy mappings mapped to dynamic theme variables for flawless dark/light contrast
        darkBg: "rgb(var(--bg-main-rgb) / <alpha-value>)",
        surface: "rgb(var(--surface-card-rgb) / <alpha-value>)",
        surfacePrimary: "rgb(var(--surface-card-rgb) / <alpha-value>)",
        surfaceSecondary: "rgb(var(--surface-muted-rgb) / <alpha-value>)",
        primaryBlue: "#3B82F6",
        purpleAccent: "#7C3AED",
        cyanAccent: "#06B6D4",
        successGreen: "#10B981",
        warningAmber: "#F59E0B",
        warningYellow: "#F59E0B",
        dangerRed: "#EF4444",
        textPrimary: "rgb(var(--text-main-rgb) / <alpha-value>)",
        textSecondary: "rgb(var(--text-muted-rgb) / <alpha-value>)",
      },
      fontFamily: {
        sans: ["var(--font-inter)", "Inter", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "Roboto", "sans-serif"],
        heading: ["var(--font-inter)", "Inter", "sans-serif"],
        mono: ["ui-monospace", "SFMono-Regular", "Menlo", "Monaco", "Consolas", "monospace"],
      },
      borderRadius: {
        DEFAULT: "8px",
        sm: "4px",
        md: "8px",
        lg: "12px",
        xl: "16px",
        "2xl": "20px",
        "3xl": "24px",
      },
      boxShadow: {
        elevation1: "0 1px 2px rgba(0, 0, 0, 0.05)",
        elevation2: "0 4px 6px -1px rgba(0, 0, 0, 0.08), 0 2px 4px -1px rgba(0, 0, 0, 0.04)",
        elevation3: "0 10px 15px -3px rgba(0, 0, 0, 0.08), 0 4px 6px -2px rgba(0, 0, 0, 0.04)",
        elevation4: "0 20px 25px -5px rgba(0, 0, 0, 0.12), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
        glowBlue: "0 0 20px -3px rgba(59, 130, 246, 0.35)",
        glowCritical: "0 0 20px -3px rgba(124, 58, 237, 0.35)",
      },
      animation: {
        pulseSlow: "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        float: "float 6s ease-in-out infinite",
        radarScan: "radar 4s linear infinite",
        shimmer: "shimmer 2.5s infinite linear",
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-10px)" },
        },
        radar: {
          "0%": { transform: "rotate(0deg)" },
          "100%": { transform: "rotate(360deg)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
