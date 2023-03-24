module.exports = {
  env: {
    browser: true,
    es2021: true,
  },
  extends: [
    'plugin:react/recommended',
    'plugin:react/jsx-runtime',
    'standard-with-typescript',
    'prettier',
  ],
  overrides: [],
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
    project: './tsconfig.json',
  },
  plugins: ['react', 'prefer-arrow-functions'],
  settings: {
    react: {
      version: 'detect',
    },
  },
  rules: {
    'no-console': 'error',
    'prefer-arrow-functions/prefer-arrow-functions': 'warn',
    '@typescript-eslint/consistent-type-assertions': 'off',
    'react/prefer-stateless-function': 'warn',
  },
};
