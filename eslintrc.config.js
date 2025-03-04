export default {
  parser: "@typescript-eslint/parser",
  extends: ["plugin:@typescript-eslint/recommended"],
  parserOptions: {
    ecmaVersion: "latest",
    sourceType: "module",
  },
  rules: {
    semi: ["error", "never"],
    quotes: ["warn", "single"],
    "@typescript-eslint/no-unused-vars": "error",
    "@typescript-eslint/member-delimiter-style": 0,
  },
};

