import Time from 'timeline/time'

import Storage from 'entity/storage'


const PRODUCTION_BASE_FACTOR = 1.0 / Time.PRODUCTION_BASE_TIME

const horseFoodConsumption = 1 / 25

const create = (colony) => {
	let lastAmount = 0
	const update = (currentTime, deltaTime) => {
		if (!colony.storage.horses) {
			return true
		}

		const unscaledAmount = horseFoodConsumption * colony.storage.horses
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