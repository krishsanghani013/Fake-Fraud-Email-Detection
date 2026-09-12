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
        darkBg: "#08090A",
        surface: "#111216",
        surfaceSecondary: "#16181D",
        primaryBlue: "#5B8CFF",
        purpleAccent: "#7C5CFC",
        cyanAccent: "#14B8A6",
        successGreen: "#22C55E",
        warningAmber: "#F59E0B",
        dangerRed: "#EF4444",
        textPrimary: "#F8FAFC",
        textSecondary: "#94A3B8",
        borderSubtle: "rgba(255,255,255,0.08)",
      },
      fontFamily: {
        sans: ["var(--font-inter)", "Inter", "sans-serif"],
        heading: ["var(--font-space)", "Space Grotesk", "sans-serif"],
      },
      borderRadius: {
        xl: "1rem",
        "2xl": "1.25rem",
        "3xl": "1.5rem",
      },
      boxShadow: {
        glowBlue: "0 0 25px -5px rgba(91, 140, 255, 0.3)",
        glowPurple: "0 0 25px -5px rgba(124, 92, 252, 0.3)",
        glowCyan: "0 0 25px -5px rgba(20, 184, 166, 0.3)",
        glowRed: "0 0 25px -5px rgba(239, 68, 68, 0.3)",
        glass: "0 8px 32px 0 rgba(0, 0, 0, 0.37)",
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
