import Message from 'util/message'

import Time from 'timeline/time'

import Europe from 'entity/europe'
import Unit from 'entity/unit'

import Factory from 'command/factory'


export default Factory.create('America', {
	unit: {
		type: 'entity',
		required: true,
	},
	eta: {
		type: 'raw',
	}
}, ({ unit, eta }) => {
	const init = currentTime => {
		if (!Europe.has.unit(unit)) {
			console.warn('unit is not in europe', unit.name)
			return false
		}

		eta = currentTime + Time.EUROPE_SAIL_TIME
		Europe.remove.unit(unit)

		return {
			unit,
			eta
		}
	}

	const update = currentTime => eta > currentTime

	const finished = () => {
		if (eta) {
			Message.send(`A ${unit.name} arrived in the new world.`)
			Unit.update.offTheMap(unit, false)
		}
	}

	return {
		init,
		update,
		finished,
	}		
})