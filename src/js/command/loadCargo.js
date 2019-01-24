import Storage from 'entity/storage'
import Record from 'util/record'
import Time from 'timeline/time'
import Events from 'view/ui/events'

const scheduledCargoLoads = {}
const scheduled = () => scheduledCargoLoads

const init = name => {
	scheduled()[name] = Storage.create()
}

const addForecast = (colony, pack) => {
	if (!scheduled()[colony.name]) {
		init(colony.name)
	}
	scheduled()[colony.name][pack.good] -= pack.amount
}
const removeForecast = (colony, pack) => {
	if (!scheduled()[colony.name]) {
		init(colony.name)
	}
	scheduled()[colony.name][pack.good] += pack.amount
}
const forecast = (colony, good) => scheduled()[colony.name] ? scheduled()[colony.name][good] : 0

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


const create = (colony, unit, pack, eta = null) => {
	addForecast(colony, pack)

	const init = currentTime => {
		if (!colony || unit.colony !== colony) {
			return false
		}

		if (!pack) {
			return false
		}

		if (!eta) {
			eta = currentTime + Time.CARGO_LOAD_TIME
		}

		return true
	}

	const update = currentTime => currentTime < eta
	const finished = () => {
		removeForecast(colony, pack)
		if (eta) {
			loadCargo(colony, unit, pack)
		}
	}

	const canceled = () => {
		removeForecast(colony, pack)
	}

	const save = () => ({
		type: 'loadCargo',
		unit: Record.reference(unit),
		colony: Record.reference(colony),
		eta,
		pack
	})

	return {
		init,
		update,
		finished,
		save,
		canceled
	}
}

const load = data => {
	const unit = Record.dereference(data.unit)
	const colony = Record.dereference(data.colony)
	return create(colony, unit, data.pack, data.eta)
}

export default {
	create,
	load,
	forecast
}