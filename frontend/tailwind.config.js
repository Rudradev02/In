/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#F8F8F5",
        surface: "#FFFFFF",
        primary: {
          DEFAULT: "#173D32",
          hover: "#123027",
          foreground: "#FFFFFF",
        },
        secondary: {
          DEFAULT: "#D9E8DB",
          foreground: "#173D32",
        },
        accent: {
          DEFAULT: "#C77B55",
          dark: "#A85F3B",
          foreground: "#FFFFFF",
        },
        charcoal: {
          DEFAULT: "#202521",
          muted: "#526058",
        },
        border: {
          DEFAULT: "#E2E6E3",
          dark: "#CCD3CE",
        },
        status: {
          success: {
            bg: "#EBF7EE",
            text: "#1F6E43",
            border: "#C8E8D0",
          },
          warning: {
            bg: "#FEF5E7",
            text: "#A66208",
            border: "#FBE3BA",
          },
          error: {
            bg: "#FDF0ED",
            text: "#B43428",
            border: "#F7CCC5",
          },
          info: {
            bg: "#EDF6FC",
            text: "#255D83",
            border: "#CCE3F4",
          },
        },
      },
      borderRadius: {
        DEFAULT: "6px",
        sm: "4px",
        md: "6px",
        lg: "8px",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
}
