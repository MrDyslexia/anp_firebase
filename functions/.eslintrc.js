module.exports = {
  root: true,
  env: {
    es6: true,
    node: true,
  },
  extends: [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "plugin:import/errors",
    "plugin:import/warnings",
    "plugin:import/typescript",
    "plugin:prettier/recommended" // siempre al final para evitar conflictos
  ],
  parser: "@typescript-eslint/parser",
  parserOptions: {
    project: ["tsconfig.json", "tsconfig.dev.json"],
    sourceType: "module",
  },
  ignorePatterns: [
    "lib/**/*", 
    "generated/**/*",
  ],
  plugins: [
    "@typescript-eslint",
    "import",
    "prettier",
  ],
  rules: {
    "quotes": ["error", "double"],
    "indent": ["error", 2],
    "max-len": ["warn", {code: 80}],
    "prettier/prettier": "error",
    "object-curly-spacing": ["error", "never"],
    "import/no-unresolved": "off",
    "@typescript-eslint/no-explicit-any": "warn", // warning, no error
    "require-jsdoc": "off",
    "valid-jsdoc": "off",
  },
};
