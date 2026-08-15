/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        forest: {
          950: "#06251C",
          900: "#0B3D2E",
          800: "#14532D",
          700: "#166534",
          600: "#1B7A4E",
          500: "#2F9E66",
          400: "#52B788",
          300: "#95D5B2",
          200: "#C8EDD8",
          100: "#E8F6EE",
          50: "#F4FBF7",
        },
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', "ui-sans-serif", "system-ui", "sans-serif"],
        display: ['"Fraunces"', "Georgia", "serif"],
      },
      boxShadow: {
        card: "0 10px 40px -18px rgba(11, 61, 46, 0.35)",
        soft: "0 8px 24px -12px rgba(11, 61, 46, 0.2)",
      },
    },
  },
  plugins: [],
};
