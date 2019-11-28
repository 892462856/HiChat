module.exports = {
  "root": true,
  "env": {
    "node": true
  },
  "extends": [
    "plugin:vue/essential",
    "eslint:recommended"
  ],
  "parserOptions": {
    "parser": "babel-eslint"
  },
  "rules": {
    "no-console": process.env.NODE_ENV === "production" ? "error" : "off",
    "no-debugger": process.env.NODE_ENV === "production" ? "error" : "off",
    "semi": [
      "error",
      "never"
    ],
    "quotes": [
      "error",
      "single"
    ],
    "no-implicit-globals": "error",
    "brace-style": [
      "error",
      "allman"
    ]
  }
}