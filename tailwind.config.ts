import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      boxShadow: {
        sm: "0 10px 30px rgba(0, 0, 0, 0.25)",
        md: "0 16px 36px rgba(0, 0, 0, 0.3)",
      },
    },
  },
  plugins: [],
};

export default config;
