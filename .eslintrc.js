module.exports = {
    root: true,
    parserOptions: {
        project: './tsconfig.eslint.json'
    },
    extends: [
        'ts-guard/ext',
        'ts-guard/no-prettier'
    ]
};
