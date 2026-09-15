/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#12141A",
        subtle: "#5B6472",
        faint: "#8A93A3",
        line: "#E3E6EA",
        surface: "#FAFBFC",
        accent: {
          DEFAULT: "#2454C7",
          dark: "#1B3F9E",
          light: "#EDF1FC",
        },
        danger: {
          DEFAULT: "#C4453B",
          light: "#FBEBEA",
        },
        success: {
          DEFAULT: "#1F8A5F",
          light: "#EAF6F0",
        },
      },
      fontFamily: {
        sans: ["IBM Plex Sans", "system-ui", "sans-serif"],
        mono: ["IBM Plex Mono", "ui-monospace", "monospace"],
      },
    },
  },
  plugins: [],
};
