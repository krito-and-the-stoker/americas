import Storage from 'entity/storage'
import Time from 'timeline/time'


const PRODUCTION_BASE_FACTOR = 1.0 / Time.PRODUCTION_BASE_TIME

const horseGrowthRate = 1 / 20
const create = (colony, tile, good, colonist = null) => {
	let lastUpdate = null
	const update = currentTime => {
		if (!lastUpdate) {
			lastUpdate = currentTime
			return true
		}
		const deltaTime = currentTime - lastUpdate
		lastUpdate = currentTime

		// only grow when we have horses and only when the settler give them food
		if (!colony.storage.horses ||  colony.storage.food < colony.storage.horses || colony.storage.horses >= colony.capacity) {
			return true
		}

		const amount = (colony.buildings.stables.level + 1) *
			deltaTime *
			horseGrowthRate *
			colony.storage.horses *
			PRODUCTION_BASE_FACTOR
		Storage.update(colony.storage, { good: 'food', amount: -amount })
		Storage.update(colony.storage, { good: 'horses', amount })
		Storage.update(colony.productionRecord, { good: 'food', amount: -amount })
		Storage.update(colony.productionRecord, { good: 'horses', amount })

		return true
	}

	return {
		update
	}
}

export default { create }