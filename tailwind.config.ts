import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        card: "var(--card)",
        border: "var(--border)",
        cream: "var(--cream)",
        ink: "var(--pixel-black)",
        mint: "var(--soft-mint)",
        sage: "var(--sage-green)",
        blush: "var(--blush-pink)",
        peach: "var(--peach)",
        lavender: "var(--lavender)",
        butter: "var(--light-yellow)",
        "card-pink": "var(--card-pink)",
        "card-green": "var(--card-green)",
        "card-yellow": "var(--card-yellow)"
      },
      boxShadow: {
        pixel: "5px 5px 0 #151515",
        soft: "0 10px 0 rgba(21,21,21,0.08)"
      },
      fontFamily: {
        pixel: ["var(--font-pixel)", "ui-monospace", "SFMono-Regular", "Consolas", "monospace"],
        mono: ["var(--font-mono)", "ui-monospace", "SFMono-Regular", "Consolas", "monospace"]
      }
    }
  },
  plugins: []
};

export default config;
