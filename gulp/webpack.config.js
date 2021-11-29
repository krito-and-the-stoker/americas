const yargs = require('yargs')
const webpack = require('webpack')
const path = require('path')


const config = () => {
	const plugins = [
		new webpack.EnvironmentPlugin({
			KEEN_SECRET: null,
			ENABLE_TRACKING: false,
			SENTRY_DSN: null
		})
	]

	const directories = ['ai', 'command', 'data', 'entity', 'input', 'interaction', 'intro', 'maps', 'render', 'task', 'timeline', 'util', 'view']
	const aliases = directories.map(dir => ({
		[dir]: path.resolve(__dirname, `../src/js/${dir}`)
	})).reduce((all, one) => ({ ...all, ...one }), {})

	return {
		mode: (yargs.argv.production || yargs.argv.staging) ? 'production' : 'development',
		entry: {
			index: './entries/index.js',
			worker: './entries/worker.js'
		},
		output: {
			filename: './[name].entry.js',
			path: path.resolve(__dirname, '../dist')
		},
		resolve: {
			fallback: {
				path: false,
				url: false
			},
			alias: {
				version: path.resolve(__dirname, '../src/version'),
				src: path.resolve(__dirname, '../src'),
				...aliases,
				test: path.resolve(__dirname, '../test')
			}
		},
		context: path.resolve(__dirname, '../src/js/'),
		plugins: plugins,
	}
}


module.exports = config()