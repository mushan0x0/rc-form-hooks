const tasks = arr => arr.join(' && ');

module.exports = {
  'hooks': {
    'pre-commit': tasks([
      'npm run lint-staged',
      'npm run test',
    ])
  }
};
