import {defineConfig} from 'tsup';

export default defineConfig({
	entry: ['./src/index.ts', './src/types.ts'],
	format: ['cjs', 'esm'],
	dts: true,
	target: 'node20',
	sourcemap: true,
	minify: true,
	publicDir: 'build',
});
