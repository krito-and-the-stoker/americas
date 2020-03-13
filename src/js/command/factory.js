import Commander from 'command/commander'

import Util from 'util/util'
import Binding from 'util/binding'
import Record from 'util/record'


const createTypes = name => {
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

	return types
}


const revive = command => {
	if (command.loaded) {
		command.loaded()
	}

	return command
}


const create = (name, params, info, functionFactory) => {
	const types = createTypes(name)

	params.tag = {
		type: 'raw'
	}

	params.initHasBeenCalled = {
		type: 'raw',
	}


	const create = (args = {}) => {
		Object.keys(args).forEach(key => {
			if (!params[key]) {
				console.warn('unspecified command creation argument', key, args, params)
			}
		})

		args.tag = args.tag || `${name} - ${Util.tag()}`
		args.info = args.info || info

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
			// console.log('saving', params, args)
			const result = Util.makeObject(Object.entries(params).concat([['module', { type: 'name' }]]).map(([key, description]) => [key, types.save[description.type](args[key])]))
			// console.log(result)
			return result
		}


		const functions = functionFactory(args)
		if (args.initHasBeenCalled) {
			delete functions.init
		}

		if (functions.init) {
			const originalInit = functions.init

			functions.init = (...initArgs) => {
				const initResult = originalInit(...initArgs)
				if (initResult) {
					Object.assign(args, initResult)
				}
				Object.assign(args, { initHasBeenCalled: true })

				return true
			}
		}

		return {
			...functions,
			save,
			tag: args.tag,
			state: args
		}
	}

	const load = data => {
		// console.log('loading', data.tag, params, data)
		const args = Util.makeObject(Object.entries(params).map(([key, description]) => [key, types.load[description.type](data[key])]))
		// console.log(args)
		return revive(create(args))
	}

	return {
		create,
		load
	}
}

const wrap = (commander, command) => {
	const wrappedCommand = {	
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
			Util.execute(command.stopped, ...x)
			Util.execute(commander.stopped, ...x)
		},
		cancel: () => {
			Util.execute(commander.cancel)
		},
		priority: true,
		tag: `Wrapped ${command.tag}`,
	}

	return wrappedCommand
}

const commander = (name, params, info, functionFactory) => {
	const types = createTypes(name)
	params.commander = {
		type: 'command'
	}

	params.initHasBeenCalled = {
		type: 'raw'
	}


	return {
		create: (...args) => {
			const commander = Commander.create()
			params.commander.initialized = commander
			const factory = create(name, params, info, functionFactory)
			const inner = factory.create(...args)

			return wrap(commander, inner)
		},
		load: data => {
			const commander = Commander.load(data.commander)

			const args = Util.makeObject(Object.entries(params).filter(([key]) => key !== 'commander').map(([key, description]) => [key, types.load[description.type](data[key])]))
			args.commander = commander
			const inner = revive(create(name, params, info, functionFactory).create(args))

			return wrap(commander, inner)
		}
	}
}

const update = {
	info: (state, info) => Binding.update(state, 'info', info),
	display: (state, display) => Binding.update(state, 'info', {
		...state.info,
		display
	})
}

export default { create, commander, update }