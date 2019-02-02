import Record from 'util/record'
import Message from 'util/message'

import Time from 'timeline/time'

import Europe from 'entity/europe'
import Unit from 'entity/unit'


const create = (unit, eta = null) => {
	const init = currentTime => {
		if (!Europe.has.unit(unit)) {
			return false
		}

		if (!eta) {
			eta = currentTime + Time.EUROPE_SAIL_TIME
			Europe.remove.unit(unit)
		}

		return true
	}

	const update = currentTime => eta > currentTime

	const finished = () => {
		if (eta) {
			Message.send(`A ${unit.name} arrived in the new world.`)
			Unit.update.offTheMap(unit, false)
		}
	}

	const save = () => ({
		type: 'america',
		eta,
		unit: Record.reference(unit)
	})

	return {
		init,
		update,
		finished,
		save
	}
}

const load = data => {
	const unit = Record.dereference(data.unit)
	return create(unit, data.eta)
}

export default {
	create,
	load
}