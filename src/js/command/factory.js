import Commander from 'command/commander'

import Util from 'util/util'
import Record from 'util/record'

const create = (name, params, functionFactory) => {
	const types = {
		save: {
			raw: x => x,
			entity: x => Record.reference(x),
			command: x => x ? x.save() : null,
			commands: x => x.filter(y => !!y).map(y => y.save()),
			name: () => name
		},

		load: {
			raw: x => x,
			entity: x => Record.dereference(x),
			command: x => {
				if (x) {
					if (x.module === 'Commander') {
						return Commander.load(x)
					}
					const Commands = require('command')
					const module = Commands.default[x.module]

					return module.load(x)
				}
				return null
			},
			commands: x => x.filter(y => !!y).map(y => types.load.command(y)),
			name: () => name
		}
	}

	params.tag = {
		type: 'raw'
	}


	const create = (args = {}) => {
		args.tag = args.tag || `${name} - ${Util.tag()}`

		Object.entries(params)
			.filter(([, description]) => description.required)
			.forEach(([key, description]) => {
				if (typeof(args[key]) === 'undefined') {
					throw new Error(`Invalid command invocation. name: ${name}, key: ${key}, arg: ${args[key]}, type: ${description.type}, required: ${description.required}`)
				}
			})

		Object.entries(params)
			.filter(([, description]) => typeof description.default !== 'undefined')
			.filter(([key]) => typeof args[key] === 'undefined')
			.forEach(([key, description]) => {
				args[key] = Util.clone(description.default)
			})

		Object.entries(params)
			.filter(([, description]) => typeof description.initialized !== 'undefined')
			.forEach(([key, description]) => {
				args[key] = description.initialized
			})

		const save = () => {
			const result = Util.makeObject(Object.entries(params).concat([['module', { type: 'name' }]]).map(([key, description]) => [key, types.save[description.type](args[key])]))
			// console.log(tag, result)
			return result
		}

		const functions = functionFactory(args)
		if (args.initHasBeenCalled) {
			delete functions.init
		}

		if (functions.init) {
			params.initHasBeenCalled = {
				type: 'raw',
			}
			const originalInit = functions.init

			functions.init = (...initArgs) => {
				args = {
					...originalInit(...initArgs),
					tag: args.tag,
					initHasBeenCalled: true
				}

				return true
			}
		}

		return {
			...functions,
			save,
			tag: args.tag
		}
	}

	const load = data => {
		// console.log('loading', data.tag, params, data)
		const args = Util.makeObject(Object.entries(params).map(([key, description]) => [key, types.load[description.type](data[key])]))
		// console.log(args)
		const result = create(args)
		if (result.loaded) {
			result.loaded()
		}

		return result
	}

	return {
		create,
		load
	}
}

const wrap = (commander, command) => ({
	...command,
	update: (...x) => {
		if (command.update) {
			if (!command.update(...x)) {
				// console.log('should stop commander here')
				// commander.schedule.stop()
			}
		}

		return commander.update(...x)
	},
	stopped: (...x) => {
		if (command.stopped) {
			command.stopped(...x)
		}
		commander.stopped(...x)
	},
	priority: true,
	state: commander.state,
	tag: `Wrapped ${command.tag}`
})

const commander = (name, params, functionFactory) => {
	params.commander = {
		type: 'command'
	}

	return {
		create: (...args) => {
			const commander = Commander.create()
			// console.log('creating auxiliary commander', commander.tag)
			params.commander.initialized = commander
			const factory = create(name, params, functionFactory)
			const inner = factory.create(...args)

			return wrap(commander, inner)
		},
		load: data => {
			const inner = create(name, params, functionFactory).load(data)
			const commander = Commander.load(data.commander)
			return wrap(commander, inner)
		}
	}
}

export default { create, commander }