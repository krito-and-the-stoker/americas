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
			.forEach(([key, description]) => {
				args[key] = description.default
			})

		const save = () => {
			return Util.makeObject(Object.entries(params).concat([['module', { type: 'name' }]]).map(([key, description]) => [key, types.save[description.type](args[key])]))
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
				args = originalInit(...initArgs)
				args.initHasBeenCalled = true
				args.tag = tag

				return true
			}
		}

		let tag = Math.random()

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

const combineOne = (one, other) => (Util.isFunction(one) || Util.isFunction(other)) ? () => Util.execute([one, other]) : (one || other)
const combine = (one, other) => Util.makeObject(
	Object.keys(one)
		.concat(Object.keys(other))
		.filter(Util.unique)
		.map(key => [key, combineOne(one[key], other[key])]))

const commander = (name, params, functionFactory) => {
	params.commander = {
		type: 'command'
	}

	return {
		create: (...args) => {
			params.commander.default = Commander.create()
			const command = create(name, params, functionFactory)
			return combine(params.commander.default, command.create(...args))
		},
		load: create(name, params, functionFactory).load
	}
}

export default { create, commander }