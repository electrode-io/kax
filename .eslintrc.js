module.exports = {
  root: true,
  env: {
    node: true,
  },
  extends: [
    'airbnb-base',
    'plugin:import/recommended',
    'plugin:prettier/recommended',
  ],
  plugins: ['prefer-arrow', 'simple-import-sort'],
  rules: {
    'func-names': 'error',
    'func-style': 'error',
    'import/prefer-default-export': 'off',
    'no-plusplus': 'off',
    'no-underscore-dangle': 'off',
    'simple-import-sort/exports': 'error',
    'simple-import-sort/imports': 'error',
    'prefer-arrow/prefer-arrow-functions': [
      'error',
      {
        disallowPrototype: true,
        singleReturnOnly: false,
        classPropertiesAllowed: false,
      },
    ],
  },
  overrides: [
    {
      files: ['*.ts'],
      parser: '@typescript-eslint/parser',
      parserOptions: {
        project: './tsconfig.json',
      },
      extends: ['airbnb-typescript/base', 'plugin:import/typescript'],
      plugins: ['@typescript-eslint/eslint-plugin'],
      rules: {
        '@typescript-eslint/indent': 'off',
        '@typescript-eslint/no-unused-vars': [
          'error',
          { argsIgnorePattern: '^_' },
        ],
        'no-unused-vars': 'off',
      },
    },
  ],
  ignorePatterns: ['dist/'],
};
