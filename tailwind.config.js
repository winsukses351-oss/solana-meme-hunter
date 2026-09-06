/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        dark: {
          900: "#0b0e14",
          800: "#121721",
          700: "#1a2230",
          600: "#253042",
        },
        brand: {
          solana: "#9945FF",
          cyan: "#14F195",
        },
      },
    },
  },
  plugins: [],
};
