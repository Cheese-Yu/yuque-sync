module.exports = {
  root: true,
  parserOptions: {
    ecmaVersion: 'latest'
  },
  env: {
    es6: true,
    node: true
  },
  extends: 'eslint:recommended',
  rules: {
    quotes: [
      'error',
      'single'
    ],
    'no-unused-vars': 'warn',
  }
}
