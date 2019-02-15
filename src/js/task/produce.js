import Util from 'util/util'

import Time from 'timeline/time'

import Production from 'entity/production'
import Storage from 'entity/storage'
import Colony from 'entity/colony'
import Europe from 'entity/europe'
import Colonist from 'entity/colonist'
import Treasure from 'entity/treasure'

const BELLS_TO_GOLD_FACTOR = 5
const PRODUCTION_BASE_FACTOR = 1.0 / Time.PRODUCTION_BASE_TIME

const create = (colony, building, colonist) => {
	let production
	let consumption
	const unsubscribe = Colonist.listen.expert(colonist, () =>
		Colony.listen.productionBonus(colony, () =>
			Colony.listen.buildings(colony, () => {
				production = Production.production(colony, building, colonist)
				consumption = Production.consumption(building)
			})))

	const update = (currentTime, deltaTime) => {
		const scale = deltaTime * PRODUCTION_BASE_FACTOR

		let productionAmount = scale * production.amount
		if (consumption.good) {
			productionAmount = Math.min(colony.storage[consumption.good], productionAmount)
		}
		if (production.good === 'bells') {
			productionAmount = Math.min(Treasure.amount() / BELLS_TO_GOLD_FACTOR, productionAmount)	
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
			const toolProduction = productionAmount *
				(colony.construction.cost ? colony.construction.cost.tools || 0 : 0) / colony.construction.cost.construction
			const toolsEfficiency = toolProduction > 0 ? Util.clamp(colony.storage.tools / toolProduction) : 1
			colony.construction.amount += toolsEfficiency * productionAmount
			colony.construction.tools += toolsEfficiency * toolProduction

			// use wood
			Storage.update(colony.storage, { good: consumption.good, amount: -toolsEfficiency * consumptionAmount })
			Storage.update(colony.productionRecord, { good: consumption.good, amount: -toolsEfficiency * unscaledConsumptionAmount })

			// use tools
			Storage.update(colony.storage, { good: 'tools', amount: -toolsEfficiency * toolProduction })
			Storage.update(colony.productionRecord, { good: 'tools', amount: -toolsEfficiency * toolProduction / scale })

			// construct
			Storage.update(colony.productionRecord, { good: production.good, amount: toolsEfficiency * unscaledProductionAmount })
			Colony.update.construction(colony)
		}
		if (production.type === 'bells') {
			Treasure.spend(productionAmount * BELLS_TO_GOLD_FACTOR)
			Colony.update.bells(colony, productionAmount)
			Storage.update(colony.productionRecord, { good: 'gold', amount: -unscaledProductionAmount })
			Storage.update(colony.productionRecord, { good: production.good, amount: productionAmount / scale })
		}
		if (production.type === 'crosses') {
			Europe.update.crosses(productionAmount)
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

export default { create }