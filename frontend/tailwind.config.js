export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        // Display serif — used only for h1/h2/h3 (hero headline, section titles).
        // This is the one "signature" typographic moment of the redesign.
        display: ['Fraunces', 'serif'],
        // Body/UI sans — unchanged from before.
        sans: ['Outfit', 'sans-serif'],
        // Functional monospace for prices, wallet addresses, token IDs.
        // Not decorative: real numeric/hex data benefits from fixed-width
        // alignment, the same reason ticker/exchange UIs use it.
        data: ['"IBM Plex Mono"', 'monospace'],
      },
    },
  },
  plugins: [],
};