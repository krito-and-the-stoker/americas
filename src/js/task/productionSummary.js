import Time from '../timeline/time'
import Storage from '../entity/storage'

const PRODUCTION_BASE_FACTOR = 1.0 / Time.PRODUCTION_BASE_TIME

const create = colony => {
	let lastUpdate = null
	const update = currentTime => {
		if (!lastUpdate) {
			lastUpdate = currentTime
			return true
		}

		const deltaTime = currentTime - lastUpdate
		const scale = deltaTime * PRODUCTION_BASE_FACTOR

		Storage.goods(colony.productionSummary).forEach(({ good }) => colony.productionSummary[good] = 0)
		Storage.productions(colony.productionSummary).forEach(({ good }) => colony.productionSummary[good] = 0)
		Storage.goods(colony.productionRecord).forEach(({ good, amount }) => colony.productionRecord[good] = Math.floor(amount / scale))
		Storage.productions(colony.productionRecord).forEach(({ good, amount }) => colony.productionRecord[good] = Math.floor(amount / scale))
		Storage.transferWithProduction(colony.productionRecord, colony.productionSummary)

		lastUpdate = currentTime
		return true
	}

	return {
		update,
	}
}

export default { create }