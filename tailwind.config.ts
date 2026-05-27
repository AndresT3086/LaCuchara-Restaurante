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
        "rojo-ladrillo-dark": "#6E1212",
        achiote: "#E07A2C",
        "achiote-dark": "#B85E18",
        maiz: "#FAF4E8",
        "maiz-2": "#F1E8D3",
        "maiz-3": "#E6D9BB",
        cafe: "#3A2418",
        "cafe-2": "#6B4A35",
        "cafe-3": "#9C8169",
        hoja: "#5C7A3A",
        "hoja-soft": "#E4ECD4",
        platano: "#E8B23A",
        "platano-soft": "#F8ECC7",
        aji: "#D43F2A",
        "aji-soft": "#F8DDD7",
        denim: "#3D6B8F",
        "denim-soft": "#DCE6EE",
        elevated: "#FFFEF9",
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
