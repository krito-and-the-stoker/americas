import Events from 'util/events'
import Record from 'util/record'


const create = (name, params) => {
	const init = () => {
		Events.trigger(name, params)
		return false
	}

	const save = () => ({
		type: 'triggerEvent',
		name,
		params: {
			type: params.type,
			unit: Record.reference(params.unit),
			colony: Record.reference(params.colony),
		}
	})

	return {
		init,
		save
	}
}

const load = data => {
	data.params.unit = Record.dereference(data.params.unit)
	data.params.colony = Record.dereference(data.params.colony)
	return create(data.name, data.params)
}

export default {
	create,
	load
}