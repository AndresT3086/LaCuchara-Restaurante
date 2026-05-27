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
        background: "var(--background)",
        foreground: "var(--foreground)",
        // La Cuchara design tokens
        "rojo-ladrillo": "#8B1A1A",
        achiote: "#E07A2C",
        maiz: "#FAF4E8",
        cafe: "#3A2418",
        hoja: "#5C7A3A",
        platano: "#E8B23A",
        aji: "#D43F2A",
      },
      fontFamily: {
        heading: ["var(--font-heading)", "Bricolage Grotesque", "system-ui", "sans-serif"],
        body: ["var(--font-body)", "DM Sans", "system-ui", "sans-serif"],
        sans: ["var(--font-body)", "DM Sans", "system-ui", "sans-serif"],
      },
      ringColor: {
        "rojo-ladrillo": "#8B1A1A",
      },
      keyframes: {
        ping: {
          "75%, 100%": { transform: "scale(2)", opacity: "0" },
        },
      },
      animation: {
        "ping-slow": "ping 2s cubic-bezier(0, 0, 0.2, 1) infinite",
      },
    },
  },
  plugins: [],
};
export default config;
