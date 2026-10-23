import type { Config } from "tailwindcss";
const config: Config = { content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"], theme: { extend: { colors: { ink: "#14243a", navy: "#10233f", teal: "#176f69", gold: "#d9b36c", paper: "#f6f4ef" }, boxShadow: { soft: "0 1px 2px rgba(20, 36, 58, 0.04), 0 4px 12px rgba(20, 36, 58, 0.035)" } } }, plugins: [] };
export default config;