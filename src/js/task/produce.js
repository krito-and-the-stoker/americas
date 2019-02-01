import Production from 'entity/production'
import Storage from 'entity/storage'
import Time from 'timeline/time'
import Colony from 'entity/colony'
import Europe from 'entity/europe'
import Colonist from 'entity/colonist'


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
		let consumptionAmount = productionAmount
		if (consumption.good) {
			Storage.update(colony.storage, { good: consumption.good, amount: -consumptionAmount })
			Storage.update(colony.productionRecord, { good: consumption.good, amount: -consumptionAmount })
		}
		if (production.type === 'good') {
			Storage.update(colony.storage, { good: production.good, amount: productionAmount })
		}
		if (production.type === 'construction') {
			colony.construction.amount += productionAmount
			Colony.update.construction(colony)
		}
		if (production.type === 'bells') {
			Colony.update.bells(colony, productionAmount)
		}
		if (production.type === 'crosses') {
			Europe.update.crosses(productionAmount)
		}
		Storage.update(colony.productionRecord, { good: production.good, amount: productionAmount })

		return true
	}

	const finished = () => {
		unsubscribe()
	}

	return {
		update,
		finished
	}
}

export default { create }