import Record from 'util/record'

import Time from 'timeline/time'

import Unit from 'entity/unit'


const create = (transport, passenger, loadingStartedAt = null) => {
	const init = currentTime => {
		if (!loadingStartedAt) {
			loadingStartedAt = currentTime
		}

		return true
	}

	const update = currentTime => {
		return currentTime < loadingStartedAt + Time.LOAD_TIME
	}

	const finished = () => {
		Unit.loadUnit(transport, passenger)
	}

	const save = () => ({
		module: 'Load',
		loadingStartedAt,
		transport: Record.reference(transport),
		passenger: Record.reference(passenger)
	})

	return {
		init,
		update,
		finished,
		save
	}
}

const load = data => {
	const transport = Record.dereference(data.transport)
	const passenger = Record.dereference(data.passenger)
	return create(transport, passenger, data.loadingStartedAt)
}

export default {
	create,
	load
}