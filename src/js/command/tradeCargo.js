import Events from 'util/events'

import Time from 'timeline/time'

import Storage from 'entity/storage'
import Europe from 'entity/europe'
import Market from 'entity/market'
import Trade from 'entity/trade'

import Factory from 'command/factory'


const tradeCargo = (unit, pack) => {
	if (pack.amount > 0) {
		const amount = Math.floor(Math.min(pack.amount, Trade.canBuyAmount(null, pack.good)))
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


export default Factory.create('TradeCargo', {
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
	id: 'tradeCargo',
	display: 'Trading in Europe'
}, ({ unit, pack, eta }) => {
	const init = currentTime => {
		if (!Europe.has.unit(unit)) {
			console.warn('unit wants to trade without being in europe', unit.name, pack)
		}

		eta = currentTime + Time.CARGO_LOAD_TIME
		return {
			eta
		}
	}

	const update = currentTime => currentTime < eta
	const finished = () => {
		if (eta) {
			tradeCargo(unit, pack)
		}
	}

	return {
		init,
		update,
		finished
	}	
})
