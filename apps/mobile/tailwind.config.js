/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        film: {
          bg: "#0D0D0D",
          orange: "#FF6B35",
          gold: "#FFD700",
          field: "#1A5C2E",
          chalk: "#F0EDE6",
        },
      },
    },
  },
  plugins: [],
};
