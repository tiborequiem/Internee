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
        // Authentic Catppuccin Mocha Palette
        mocha: {
          base: "#1e1e2e",
          mantle: "#181825",
          crust: "#11111b",
          surface0: "#313244",
          surface1: "#45475a",
          surface2: "#585b70",
          overlay0: "#6c7086",
          overlay1: "#7f849c",
          subtext0: "#a6adc8",
          subtext1: "#bac2de",
          text: "#cdd6f4",
          mauve: "#cba6f7",
          lavender: "#b4befe",
          blue: "#89b4fa",
          sapphire: "#74c7ec",
          sky: "#89dceb",
          teal: "#94e2d5",
          green: "#a6e3a1",
          yellow: "#f9e2af",
          peach: "#fab387",
          maroon: "#eba0ac",
          red: "#f38ba8",
          pink: "#f5c2e7",
          flamingo: "#f2cdcd",
          rosewater: "#f5e0dc",
        },
        // Semantic mappings to Mocha
        obsidian: {
          bg: "#1e1e2e", // Base
          surface: "#181825", // Mantle
          border: "#45475a", // Surface1
          subtle: "#313244", // Surface0
          hover: "#313244", // Surface0
          crust: "#11111b", // Crust
        },
        primaryText: "#cdd6f4", // Mocha Text
        mutedText: "#a6adc8", // Mocha Subtext0
        overlayText: "#6c7086", // Mocha Overlay0
        accent: {
          DEFAULT: "#cba6f7", // Mauve
          light: "#b4befe", // Lavender
          hover: "#b4befe", // Lavender
        },
        indicator: {
          green: "#a6e3a1", // Mocha Green
        },
        sourceBadge: {
          linkedin: "#74c7ec", // Sapphire
          form: "#fab387", // Peach
          social: "#f5c2e7", // Pink
          portal: "#94e2d5", // Teal
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
