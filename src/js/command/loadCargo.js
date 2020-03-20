import Events from 'util/events'
import Message from 'util/message'

import Time from 'timeline/time'

import Storage from 'entity/storage'
import Forecast from 'entity/forecast'
import Unit from 'entity/unit'

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
	}
}, {
	id: 'loadCargo',
	display: 'Loading cargo'
}, ({ colony, unit, pack }) => {
	Forecast.add(colony, pack)
	const loadingSpeed = 1.0 / (Time.CARGO_BASE_LOAD_TIME
			* (unit.domain === 'sea' ? 4 - colony.buildings.harbour.level : 1))

	const init = () => {
		if (unit.colony !== colony) {
			Message.warn('unit loads cargo but is not inside colony', colony.name, Unit.name(unit), pack)
		}
	}

	const update = (currentTime, deltaTime) => {
		if (pack.amount > 0) {		
			const amount = Math.min(
				pack.amount * deltaTime * loadingSpeed,
				colony.storage[pack.good],
				pack.amount - unit.storage[pack.good])
			Storage.transfer(colony.storage, unit.storage, { good: pack.good, amount })
			
			return unit.storage[pack.good] < pack.amount && colony.storage[pack.good] > 0
		}

		if (pack.amount < 0) {
			const amount = Math.min(-pack.amount * deltaTime * loadingSpeed, unit.storage[pack.good])
			Storage.transfer(unit.storage, colony.storage, { good: pack.good, amount })

			return unit.storage[pack.good] > 0
		}
	}

	const finished = () => {
		Forecast.remove(colony, pack)
		const eventName = pack.amount > 0 ? 'unloadGood' : 'loadGood'
		Events.trigger(eventName, { colony, good: pack.good })
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
