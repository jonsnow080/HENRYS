// Color system: added brand palette + semantic aliases for HENRY'S.
import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/app/**/*.{ts,tsx,mdx}",
    "./src/components/**/*.{ts,tsx}",
    "./src/ui/**/*.{ts,tsx}",
    "./src/lib/**/*.{ts,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        mint: {
          50: "#F4FAF3",
          100: "#E7F3E6",
          200: "#D0E7CE",
          300: "#B7D7B2",
          400: "#9FCB9B",
          500: "#7FB87B",
          600: "#5F9C5D",
        },
        green: {
          50: "#EBF3F0",
          100: "#D0E3DC",
          200: "#A0C7B9",
          300: "#70AB95",
          400: "#3C7F68",
          500: "#144738",
          600: "#0C2E24",
          700: "#061913",
        },
        beige: {
          50: "#FFFCF6",
          100: "#FFF9E9",
          200: "#F7EFD5",
          300: "#EADDB8",
          400: "#DCC69C",
          500: "#C5AB78",
        },
        sand: { DEFAULT: "#EBDDC4" },
        ink: { DEFAULT: "#0A1C18" },
        blush: { DEFAULT: "#F9E3DA" },
        gold: { DEFAULT: "#C6A667" },
        success: {
          500: "#4CAF50",
          600: "#3E8D42",
        },
        warning: {
          500: "#D1A551",
          600: "#B68C3F",
        },
        error: {
          500: "#D95A5A",
          600: "#B94747",
        },
        info: {
          500: "#4C96D2",
          600: "#3A7EB4",
        },
        gray: {
          50: "#F9FAFB",
          100: "#F2F4F5",
          200: "#E4E7EA",
          300: "#CDD1D5",
          400: "#9CA3AF",
          500: "#6B7280",
          600: "#4B5563",
          700: "#374151",
          800: "#1F2937",
          900: "#111827",
        },
        brand: {
          bg: "var(--color-brand-bg)",
          "bg-muted": "var(--color-brand-bg-muted)",
          fg: "var(--color-brand-fg)",
          primary: "var(--color-brand-primary)",
          "primary-soft": "var(--color-brand-primary-soft)",
          accent: "var(--color-brand-accent)",
          badge: "var(--color-brand-badge)",
        },
        button: {
          primary: {
            bg: "var(--color-button-primary-bg)",
            hover: "var(--color-button-primary-hover)",
            text: "var(--color-button-primary-text)",
          },
          secondary: {
            bg: "var(--color-button-secondary-bg)",
            hover: "var(--color-button-secondary-hover)",
            text: "var(--color-button-secondary-text)",
          },
        },
        border: {
          subtle: "var(--color-border-subtle)",
          strong: "var(--color-border-strong)",
        },
        primary: "var(--color-brand-primary)",
      },
      backgroundImage: {
        "gradient-mint-green": "linear-gradient(135deg, #D0E7CE, #B7D7B2, #144738)",
        "gradient-beige-mint": "linear-gradient(135deg, #FFF9E9, #D0E7CE)",
        "gradient-premium": "linear-gradient(135deg, #144738, #C6A667)",
      },
    },
  },
};

export default config;
