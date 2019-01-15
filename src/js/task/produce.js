import Building from '../entity/building'
import Storage from '../entity/storage'
import Time from '../timeline/time'
import Colony from '../entity/colony'
import Europe from '../entity/europe'



const PRODUCTION_BASE_FACTOR = 1.0 / Time.PRODUCTION_BASE_TIME

const create = (colony, building, colonist) => {
	let lastUpdate = null
	const update = currentTime => {
		if (!lastUpdate) {
			lastUpdate = currentTime
			return true
		}

		const deltaTime = currentTime - lastUpdate
		const scale = deltaTime * PRODUCTION_BASE_FACTOR
		lastUpdate = currentTime

		if (building === 'colony') {
			Europe.update.crosses(scale)
			Storage.update(colony.productionRecord, { good: 'crosses', amount: scale })
			Colony.update.bells(colony, scale)
			Storage.update(colony.productionRecord, { good: 'bells', amount: scale })
			return true
		}

		const consumption = Building.consumption(colony, building, colonist, scale)
		const production = Building.production(colony, building, colonist, scale)
		if (consumption) {
			Storage.update(colony.storage, { good: consumption.good, amount: -consumption.amount })
			Storage.update(colony.productionRecord, { good: consumption.good, amount: -consumption.amount })
		}
		if (production && production.good) {
			Storage.update(colony.storage, { good: production.good, amount: production.amount })
			Storage.update(colony.productionRecord, { good: production.good, amount: production.amount })
		}
		if (production && production.type) {
			if (production.type === 'construction') {
				colony.construction.amount += production.amount
				Colony.update.construction(colony)
			}
			if (production.type === 'bells') {
				Colony.update.bells(colony, production.amount)
			}
			if (production.type === 'crosses') {
				Europe.update.crosses(production.amount)
			}
			Storage.update(colony.productionRecord, { good: production.type, amount: production.amount })
		}

		return true
	}

	return {
		update
	}
}

export default { create }