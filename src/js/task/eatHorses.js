import Time from 'timeline/time'

import Util from 'util/util'

import Storage from 'entity/storage'


const PRODUCTION_BASE_FACTOR = 1.0 / Time.PRODUCTION_BASE_TIME

const create = (colony) => {
	const update = (currentTime, deltaTime) => {
		if (!colony.storage.horses) {
			return true
		}

		// eat horses when out of food
		const amount = Util.clamp(deltaTime * PRODUCTION_BASE_FACTOR * (colony.storage.horses - colony.storage.food), 0, colony.storage.horses)
		const unscaledAmount = amount / (deltaTime * PRODUCTION_BASE_FACTOR)
		Storage.update(colony.storage, { good: 'food', amount })
		Storage.update(colony.storage, { good: 'horses', amount: -amount })
		Storage.update(colony.productionRecord, { good: 'food', amount: unscaledAmount })
		Storage.update(colony.productionRecord, { good: 'horses', amount: -unscaledAmount })

		return true
	}

	return {
		update,
		sort: 4,
	}
}

export default { create }