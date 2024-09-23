module.exports = {
  root: true,
  extends: ["@repo/eslint-config/next.js"],
  rules: {
    "no-restricted-imports": ["error", "next/link"],
  },
};
