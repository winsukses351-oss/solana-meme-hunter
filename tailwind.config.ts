import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#090A0F",
        surface: "#12141D",
        surfaceBorder: "#1E2230",
        brandAccent: "#10B981",
        brandDanger: "#EF4444",
        brandWarning: "#F59E0B",
      },
    },
  },
  plugins: [],
};

export default config;
