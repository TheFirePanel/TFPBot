/* eslint-env node */
module.exports = {
	extends: [
		'eslint:recommended',
		'plugin:@typescript-eslint/recommended'
	],
	parser: '@typescript-eslint/parser',
	plugins: ['@typescript-eslint'],
	root: true,
	rules: {
		"no-useless-escape": "off",
		"no-unused-vars": "off",
		"@typescript-eslint/no-unused-vars": ["error", { 
			"argsIgnorePattern": "^_",
			"varsIgnorePattern": "^_",
			"caughtErrorsIgnorePattern": "^_"
		}]
	}
  };