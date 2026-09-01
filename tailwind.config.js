/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      fontFamily: {
        heading: ["Oswald", "system-ui", "sans-serif"],
        body: ["Inter", "system-ui", "sans-serif"],
      },
      colors: {
        ink: {
          950: "#0b0b0d",
          900: "#131316",
          800: "#1c1c20",
          700: "#28282e",
          600: "#3a3a42",
          500: "#55555f",
          400: "#7a7a85",
          300: "#a3a3ac",
          200: "#cdcdd3",
          100: "#eaeaee",
        },
        blaze: {
          950: "#3d1400",
          900: "#5c1e00",
          800: "#7a2900",
          700: "#a63700",
          600: "#d44700",
          500: "#ff5c00",
          400: "#ff7a2e",
          300: "#ff9c5c",
          200: "#ffc39a",
          100: "#ffe3cc",
        },
      },
      boxShadow: {
        blaze: "0 0 0 1px rgba(255,92,0,0.4), 0 8px 30px -4px rgba(255,92,0,0.45)",
        card: "0 1px 0 rgba(255,255,255,0.04) inset, 0 8px 24px -8px rgba(0,0,0,0.6)",
      },
      backgroundImage: {
        "blaze-gradient": "linear-gradient(135deg, #ff7a2e 0%, #ff5c00 45%, #d44700 100%)",
        "grit": "radial-gradient(circle at 20% -10%, rgba(255,92,0,0.16), transparent 55%)",
      },
      animation: {
        "pulse-glow": "pulseGlow 2.4s ease-in-out infinite",
        "flame-in": "flameIn 0.4s cubic-bezier(0.34,1.56,0.64,1)",
      },
      keyframes: {
        pulseGlow: {
          "0%, 100%": { boxShadow: "0 0 0 0 rgba(255,92,0,0.55)" },
          "50%": { boxShadow: "0 0 0 10px rgba(255,92,0,0)" },
        },
        flameIn: {
          "0%": { transform: "scale(0.3) rotate(-8deg)", opacity: "0" },
          "100%": { transform: "scale(1) rotate(0deg)", opacity: "1" },
        },
      },
    },
  },
  plugins: [],
};
