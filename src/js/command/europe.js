import Record from 'util/record'
import Message from 'util/message'

import Time from 'timeline/time'

import MapEntity from 'entity/map'
import Unit from 'entity/unit'

// import EnterEurope from 'interaction/enterEurope'

// import Notification from 'view/ui/notification'


const create = (unit, eta = null) => {
	const init = currentTime => {
		const tile = MapEntity.tile(unit.mapCoordinates)
		if (tile.name !== 'sea lane') {
			console.warn('not going to europe', tile.name, unit, tile)
			return false
		}

		if (!eta) {
			eta = currentTime + Time.EUROPE_SAIL_TIME
		}

		Unit.update.offTheMap(unit, true)

		return true
	}

	const update = currentTime => eta > currentTime

	const finished = () => {
		if (eta) {
			Message.send(`A ${unit.name} arrived in Europe.`)
			Notification.create({ type: 'europe', unit })
			EnterEurope(unit)
		}
	}

	const save = () => ({
		type: 'europe',
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