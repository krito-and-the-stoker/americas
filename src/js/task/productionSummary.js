import Time from 'timeline/time'
import Storage from 'entity/storage'


const PRODUCTION_BASE_FACTOR = 1.0 / Time.PRODUCTION_BASE_TIME
const updateFactor = 1.0

const create = colony => {
	const intermediateProductionRecord = Storage.createWithProduction()
	const update = (currentTime, deltaTime) => {
		const scale = deltaTime * PRODUCTION_BASE_FACTOR
		
		if (scale > 0 && Storage.hasListener(colony.productionSummary)) {
			Storage.goods(colony.productionRecord).forEach(({ good, amount }) =>
				intermediateProductionRecord[good] = (1.0 - updateFactor)*intermediateProductionRecord[good] + updateFactor*amount)
			Storage.productions(colony.productionRecord).forEach(({ good, amount }) =>
				intermediateProductionRecord[good] = (1.0 - updateFactor)*intermediateProductionRecord[good] + updateFactor*amount)
			Storage.goods(colony.productionRecord).forEach(({ good }) => colony.productionRecord[good] = 0)
			Storage.productions(colony.productionRecord).forEach(({ good }) => colony.productionRecord[good] = 0)
			Storage.goods(colony.productionSummary).forEach(({ good }) => colony.productionSummary[good] = Math.round(intermediateProductionRecord[good] / scale))
			Storage.productions(colony.productionSummary).forEach(({ good }) => colony.productionSummary[good] = Math.round(intermediateProductionRecord[good] / scale))
			Storage.update(colony.productionSummary)
		}

		return true
	}

	return {
		update
	}
}

export default { create }