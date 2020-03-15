import Events from 'util/events'
import Message from 'util/message'

import Time from 'timeline/time'

import Storage from 'entity/storage'
import Forecast from 'entity/forecast'

import Factory from 'command/factory'


const loadCargo = (colony, unit, pack) => {
	if (pack.amount > 0) {
		const amount = Math.min(pack.amount, colony.storage[pack.good])
		Storage.transfer(colony.storage, unit.storage, { good: pack.good, amount })
		Events.trigger('unloadGood', { colony, good: pack.good })
	}
	if (pack.amount < 0) {
		const amount = Math.min(-pack.amount, unit.storage[pack.good])
		Storage.transfer(unit.storage, colony.storage, { good: pack.good, amount })
		Events.trigger('loadGood', { colony, good: pack.good })
	}
}


export default Factory.create('LoadCargo', {
	colony: {
		type: 'entity',
		required: true
	},
	unit: {
		type: 'entity',
		required: true
	},
	pack: {
		type: 'raw',
		required: true
	},
	eta: {
		type: 'raw'
	}
}, {
	id: 'loadCargo',
	display: 'Loading cargo'
}, ({ colony, unit, pack, eta }) => {
	Forecast.add(colony, pack)

	const init = currentTime => {
		if (unit.colony !== colony) {
			Message.warn('unit loads cargo but is not inside colony', colony.name, unit.name, pack)
		}

		eta = currentTime + Time.CARGO_LOAD_TIME
		return {
			eta
		}
	}

	const update = currentTime => eta && currentTime < eta
	const finished = () => {
		Forecast.remove(colony, pack)
		if (eta) {
			loadCargo(colony, unit, pack)
		}
	}

	const canceled = () => {
		Forecast.remove(colony, pack)
	}

	return {
		init,
		update,
		finished,
		canceled
	}
})
