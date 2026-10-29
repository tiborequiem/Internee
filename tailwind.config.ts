import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        obsidian: {
          bg: "#0D0D0C",
          surface: "#161614",
          border: "#262624",
          subtle: "#222220",
          hover: "#1A1A18",
        },
        primaryText: "#ECECEC",
        mutedText: "#8E8D8A",
        accent: {
          DEFAULT: "#D97757", // warm sand / terracotta
          light: "#E5E5E0",
          hover: "#C86B4D",
        },
        indicator: {
          green: "#4ADE80",
        },
      },
      fontFamily: {
        sans: [
          "-apple-system",
          "BlinkMacSystemFont",
          '"Segoe UI"',
          "Roboto",
          '"Helvetica Neue"',
          "Arial",
          "sans-serif",
        ],
        mono: [
          "ui-monospace",
          "SFMono-Regular",
          "Menlo",
          "Monaco",
          "Consolas",
          '"Liberation Mono"',
          '"Courier New"',
          "monospace",
        ],
      },
    },
  },
  plugins: [],
};

export default config;
