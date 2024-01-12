import type { Config } from "tailwindcss";
import forms from "@tailwindcss/forms";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          red: "#f44250",
          yellow: "#fecc1b",
          green: "#6bd968",
          aqua: "#3defe9",
          blue: "#3992ff",
          pink: "#d83bd2",
        },
      },
    },
  },
  plugins: [forms({ strategy: "class" })],
};
export default config;
