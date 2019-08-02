import Time from 'timeline/time'

import Storage from 'entity/storage'
import Unit from 'entity/unit'


const PRODUCTION_BASE_FACTOR = 1.0 / Time.PRODUCTION_BASE_TIME

const create = (colony) => {
	const update = (currentTime, deltaTime) => {
		if (!colony.storage.horses) {
			return true
		}

		const unscaledAmount = Unit.FOOD_COST_PER_HORSE * colony.storage.horses
		const amount = deltaTime * PRODUCTION_BASE_FACTOR * unscaledAmount
		Storage.update(colony.storage, { good: 'food', amount: -amount })
		Storage.update(colony.productionRecord, { good: 'food', amount: -unscaledAmount })

		return true
	}

	return {
		update,
		sort: 3,
	}
}

export default { create }