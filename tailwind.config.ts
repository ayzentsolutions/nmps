import type { Config } from "tailwindcss";
const config: Config = { content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"], theme: { extend: { colors: { ink: "#14243a", navy: "#10233f", teal: "#1d837c", gold: "#d9b36c", paper: "#f6f4ef" }, boxShadow: { soft: "0 20px 60px rgba(17, 35, 63, 0.08)" } } }, plugins: [] };
export default config;