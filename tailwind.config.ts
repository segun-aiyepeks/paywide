import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#00236f",
          container: "#1e3a8a",
          fixed: "#dce1ff",
          "fixed-dim": "#b6c4ff",
        },
        secondary: {
          DEFAULT: "#006c4a",
          container: "#82f5c1",
          "on-container": "#00714e",
          fixed: "#85f8c4",
          "fixed-dim": "#68dba9",
        },
        surface: {
          DEFAULT: "#faf8ff",
          dim: "#d2d9f4",
          bright: "#faf8ff",
          "container-lowest": "#ffffff",
          "container-low": "#f2f3ff",
          container: "#eaedff",
          "container-high": "#e2e7ff",
          "container-highest": "#dae2fd",
        },
        "on-surface": {
          DEFAULT: "#131b2e",
          variant: "#444651",
        },
        outline: {
          DEFAULT: "#757682",
          variant: "#c5c5d3",
        },
        "inverse-surface": "#283044",
        "inverse-on-surface": "#eef0ff",
        error: {
          DEFAULT: "#ba1a1a",
          container: "#ffdad6",
          "on-container": "#93000a",
        },
      },
      fontFamily: {
        heading: ["var(--font-space-grotesk)", "Space Grotesk", "sans-serif"],
        body: ["var(--font-montserrat)", "Montserrat", "sans-serif"],
      },
      borderRadius: {
        DEFAULT: "0.125rem",
        lg: "0.25rem",
        xl: "0.5rem",
        "2xl": "0.75rem",
        full: "9999px",
      },
    },
  },
  plugins: [],
};

export default config;
