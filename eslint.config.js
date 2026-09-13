import js from '@eslint/js';
import { defineConfig } from 'eslint/config';
import globals from 'globals';
import svelte from 'eslint-plugin-svelte';
import tseslint from 'typescript-eslint';

export default defineConfig(
	{
		ignores: ['.svelte-kit/', 'build/', 'node_modules/']
	},
	js.configs.recommended,
	tseslint.configs.recommended,
	svelte.configs.recommended,
	{
		languageOptions: {
			globals: { ...globals.browser, ...globals.node }
		}
	},
	{
		files: ['**/*.svelte'],
		languageOptions: {
			parserOptions: { parser: tseslint.parser }
		}
	}
);
