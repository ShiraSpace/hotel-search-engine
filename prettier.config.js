/** @type {import("prettier").Config} */
const config = {
  singleQuote: true,
  semi: true,
  tabWidth: 2,
  trailingComma: 'es5',
  plugins: ['prettier-plugin-tailwindcss'],
};

module.exports = config;
