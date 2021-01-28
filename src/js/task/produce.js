import Util from 'util/util'

import Time from 'timeline/time'

import Production from 'entity/production'
import Storage from 'entity/storage'
import Colony from 'entity/colony'
import Europe from 'entity/europe'
import Colonist from 'entity/colonist'
import Treasure from 'entity/treasure'

const BELLS_TO_GOLD_FACTOR = 10
const PRODUCTION_BASE_FACTOR = 1.0 / Time.PRODUCTION_BASE_TIME

const create = (colony, building, colonist) => {
	let production
	let consumption
	const unsubscribe = Colonist.listen.expert(colonist, () =>
		Colony.listen.productionBonus(colony, () =>
			Colony.listen.buildings(colony, () => 
				Colonist.listen.productionModifier(colonist, productionModifier => {
					production = Production.production(colony, building, colonist)
					consumption = Production.consumption(building)
				}))))

	const update = (currentTime, deltaTime) => {
		const scale = deltaTime * PRODUCTION_BASE_FACTOR

		let productionAmount = scale * production.amount
		if (consumption.good) {
			productionAmount = Math.min(colony.storage[consumption.good], productionAmount)
		}
		if (production.good === 'bells') {
			productionAmount = Util.clamp(Treasure.amount() / BELLS_TO_GOLD_FACTOR, 0, productionAmount)	
		}
		const consumptionAmount = productionAmount
		const unscaledProductionAmount = productionAmount / scale
		const unscaledConsumptionAmount = consumptionAmount / scale
		if (consumption.good && production.type !== 'construction') {
			Storage.update(colony.storage, { good: consumption.good, amount: -consumptionAmount })
			Storage.update(colony.productionRecord, { good: consumption.good, amount: -unscaledConsumptionAmount })
			Storage.update(colony.productionRecord, { good: production.good, amount: unscaledProductionAmount })
		}

		if (production.type === 'good') {
			Storage.update(colony.storage, { good: production.good, amount: productionAmount })
		}
		if (production.type === 'construction') {
			// TODO: do the construction
		}
		if (production.type === 'bells') {
			Treasure.spend(productionAmount * BELLS_TO_GOLD_FACTOR)
			Colony.update.bells(colony, productionAmount)
			Storage.update(colony.productionRecord, { good: 'gold', amount: -BELLS_TO_GOLD_FACTOR * unscaledProductionAmount })
			Storage.update(colony.productionRecord, { good: production.good, amount: productionAmount / scale })
		}
		if (production.type === 'crosses') {
			Colony.update.crosses(colony, productionAmount)
			Storage.update(colony.productionRecord, { good: production.good, amount: productionAmount / scale })
		}

		return true
	}

	const finished = () => {
		unsubscribe()
	}

	return {
		update,
		finished,
		sort: 4
	}
}

export default { create, BELLS_TO_GOLD_FACTOR }