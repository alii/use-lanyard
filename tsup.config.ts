import {defineConfig} from 'tsup';

export default defineConfig({
	entry: ['./src/index.ts'],
	format: ['cjs', 'esm'],
	dts: true,
	target: 'node24',
	minify: true,
	publicDir: 'build',
	clean: true,
});
