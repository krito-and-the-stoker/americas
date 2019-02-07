import Record from 'util/record'
import Events from 'util/events'

import Time from 'timeline/time'

import Storage from 'entity/storage'
import Europe from 'entity/europe'
import Market from 'entity/market'
import Trade from 'entity/trade'
import Treasure from 'entity/treasure'


const tradeCargo = (unit, pack) => {
	if (pack.amount > 0) {
		const amount = Math.floor(Math.min(pack.amount, (Treasure.amount() - Trade.TREASURE_MIN) / Market.ask(pack.good)))
		Market.buy({ good: pack.good, amount })
		Storage.update(unit.storage, { good: pack.good, amount })
		Events.trigger('buy', { good: pack.good, amount })
	}

	if (pack.amount < 0) {
		const amount = Math.min(-pack.amount, unit.storage[pack.good])
		Market.sell({ good: pack.good, amount })
		Storage.update(unit.storage, { good: pack.good, amount: -amount })
		Events.trigger('sell', { good: pack.good, amount })
	}
}


const create = (unit, pack, eta = null) => {
	const init = currentTime => {
		if (!Europe.has.unit(unit)) {
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
		if (eta) {
			tradeCargo(unit, pack)
		}
	}


	const save = () => ({
		module: 'TradeCargo',
		unit: Record.reference(unit),
		eta,
		pack
	})

	return {
		init,
		update,
		finished,
		save,
	}
}

const load = data => {
	const unit = Record.dereference(data.unit)

	return create(unit, data.pack, data.eta)
}

export default {
	create,
	load,
}