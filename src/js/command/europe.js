import Message from 'util/message'

import Time from 'timeline/time'

import MapEntity from 'entity/map'
import Unit from 'entity/unit'

import Factory from 'command/factory'

import EnterEurope from 'interaction/enterEurope'

export default Factory.create('Europe', {
	unit: {
		type: 'entity',
		required: true
	},
	eta: {
		type: 'raw'
	}
}, {
	id: 'europe',
	display: 'Travelling to Europe'
}, ({ unit, eta }) => {
	const init = currentTime => {
		const tile = MapEntity.tile(unit.mapCoordinates)
		if (tile.name !== 'sea lane') {
			console.warn('not going to europe', tile.name, unit, tile)
			return false
		}

		eta = currentTime + Time.EUROPE_SAIL_TIME
		Unit.update.offTheMap(unit, true)

		return {
			eta
		}
	}

	const update = currentTime => eta > currentTime

	const finished = () => {
		if (eta) {
			Message.send(`A ${unit.name} arrived in Europe.`)
			EnterEurope(unit)
		}
	}

	return {
		init,
		update,
		finished
	}
})
