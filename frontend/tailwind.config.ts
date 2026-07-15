import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#17212b",
        campus: "#0f766e",
        line: "#d6dee5",
        paper: "#f7f3ea"
      },
      boxShadow: {
        soft: "0 8px 24px rgba(20, 34, 45, 0.08)"
      }
    }
  },
  plugins: []
} satisfies Config;

