module.exports = {
  extends: '@whalecloud/eslint-config/configurations/typescript',
  rules: {
    'no-await-in-loop': 'off',
    // require parens in arrow function arguments
    // 要求箭头函数的参数使用圆括号
    // https://eslint.org/docs/rules/arrow-parens
    'arrow-parens': [
      'error',
      'as-needed',
      {
        requireForBlockBody: true,
      },
    ],

    'react/destructuring-assignment': ['error', 'always'],

    // 注释块在第一行的时候，允许不空行
    'lines-around-comment': ['error', { beforeBlockComment: true, allowBlockStart: true }],

    'react/prefer-stateless-function': 'warn',

    'no-mixed-operators': 'off',

    'no-restricted-syntax': [
      'error',
      {
        selector: 'LabeledStatement',
        message: 'Labels are a form of GOTO; using them makes code confusing and hard to maintain and understand.',
      },
      {
        selector: 'WithStatement',
        message: '`with` is disallowed in strict mode because it makes code impossible to predict and optimize.',
      },
    ],
  },
  globals: {
    document: true,
  },
};
