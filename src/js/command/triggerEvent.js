import Events from 'util/events'
import Record from 'util/record'


const create = (name, params) => {
	const init = () => {
		Events.trigger(name, params)
		return false
	}

	const save = () => ({
		module: 'TriggerEvent',
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
	const unit = Record.dereference(data.params.unit)
	const colony = Record.dereference(data.params.colony)

	return create(data.name, {
		type: data.params.type,
		unit,
		colony
	})
}

export default {
	create,
	load
}