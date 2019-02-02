const yargs = require('yargs')
const webpack = require('webpack')
const path = require('path')


const config = () => {
	const plugins = []
	if (yargs.argv.production) {
		plugins.push(new webpack.EnvironmentPlugin(['KEEN_SECRET', 'ENABLE_TRACKING', 'SENTRY_DSN']))
	}

	const directories = ['ai', 'command', 'data', 'entity', 'input', 'interaction', 'render', 'task', 'timeline', 'util', 'view']
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
			alias: {
				version: path.resolve(__dirname, '../src/version'),
				...aliases
			}
		},
		devtool: (yargs.argv.production || yargs.argv.staging) ? 'eval' : 'source-map',
		context: path.resolve(__dirname, '../src/js/'),
		plugins: plugins
	}
}


module.exports = config()