export default {
  printWidth: 200,
  tabWidth: 2,
  useTabs: false,
  semi: true,
  singleQuote: true,
  trailingComma: "all",
  plugins: ["prettier-plugin-tailwindcss"],
  overrides: [
    {
      files: ["*.html", "*.jsx", "*.tsx"],
      options: { printWidth: 500 },
    },
  ],
};
