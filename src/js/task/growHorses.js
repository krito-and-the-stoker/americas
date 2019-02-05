import Time from 'timeline/time'

import Storage from 'entity/storage'


const PRODUCTION_BASE_FACTOR = 1.0 / Time.PRODUCTION_BASE_TIME

const adaptionRate = 0.5
const horseGrowthRate = 1 / 20
const create = (colony) => {
	let lastAmount = 0
	const update = (currentTime, deltaTime) => {
		// strangely enough this algorithm seems to give the best stability for sniffing an accurate production
		const deltaFoodWithoutHorses = 2 * PRODUCTION_BASE_FACTOR * deltaTime * colony.productionSummary.food

		// only grow when we have horses and only when the settler give them food
		if (!colony.storage.horses ||  colony.storage.horses >= colony.capacity) {
			return true
		}

		const newAmount = Math.min((colony.buildings.stables.level + 1) *
			deltaTime *
			horseGrowthRate *
			colony.storage.horses *
			PRODUCTION_BASE_FACTOR, Math.max(0.5*deltaFoodWithoutHorses, 0))
		const amount = adaptionRate * newAmount + (1 - adaptionRate) * lastAmount
		lastAmount = amount
		const unscaledAmount = amount / (PRODUCTION_BASE_FACTOR * deltaTime)
		Storage.update(colony.storage, { good: 'food', amount: -amount })
		Storage.update(colony.storage, { good: 'horses', amount })
		Storage.update(colony.productionRecord, { good: 'food', amount: -unscaledAmount })
		Storage.update(colony.productionRecord, { good: 'horses', amount: unscaledAmount })

		return true
	}

	return {
		update
	}
}

export default { create }