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
			command: x => x ? Commander.load(x) : null,
			commands: x => x.filter(y => !!y).map(y => Commander.load(y)),
			name: () => name
		}
	}


	const create = (args = {}) => {
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
			return Util.makeObject(Object.entries(params).concat([['module', { type: 'name' }]]).map(([key, description]) => [key, types.save[description.type](args[key])]))
		}

		let tag = `${name} - ${Util.tag()}`
		args.tag = tag

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
				args = originalInit(...initArgs)
				args.initHasBeenCalled = true
				args.tag = tag

				return true
			}
		}

		return {
			...functions,
			save,
			tag
		}
	}

	const load = data => create(Util.makeObject(Object.entries(params).map(([key, description]) => [key, types.load[description.type](data[key])])))

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
			const command = factory.create(...args)

			return wrap(commander, command)
		},
		load: create(name, params, functionFactory).load
	}
}

export default { create, commander }