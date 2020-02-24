import Time from 'timeline/time'

import Storage from 'entity/storage'


const PRODUCTION_BASE_FACTOR = 1.0 / Time.PRODUCTION_BASE_TIME

const horseGrowthRate = 0.02 // every 50 horses grow 1 new horse production base time
const create = (colony) => {
	const update = (currentTime, deltaTime) => {
		// only grow when we have horses and only when the settler have food
		if (!colony.storage.horses || colony.storage.food <= 0) {
			return true
		}

		const amount = (colony.buildings.stables.level + 1) *
			deltaTime *
			horseGrowthRate *
			colony.storage.horses *
			PRODUCTION_BASE_FACTOR
		
		const unscaledAmount = amount / (PRODUCTION_BASE_FACTOR * deltaTime)
		Storage.update(colony.storage, { good: 'horses', amount })
		Storage.update(colony.productionRecord, { good: 'horses', amount: unscaledAmount })

		return true
	}

	return {
		update,
		sort: 3,
	}
}

export default { create }