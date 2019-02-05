import Storage from 'entity/storage'


const updateFactor = 1.0

const create = colony => {
	const intermediateProductionRecord = Storage.createWithProduction()
	const update = (currentTime, deltaTime) => {
		if (deltaTime > 0) {
			Storage.goods(colony.productionRecord).forEach(({ good, amount }) =>
				intermediateProductionRecord[good] = (1.0 - updateFactor)*intermediateProductionRecord[good] + updateFactor*amount)
			Storage.productions(colony.productionRecord).forEach(({ good, amount }) =>
				intermediateProductionRecord[good] = (1.0 - updateFactor)*intermediateProductionRecord[good] + updateFactor*amount)
			Storage.goods(colony.productionRecord).forEach(({ good }) => colony.productionRecord[good] = 0)
			Storage.productions(colony.productionRecord).forEach(({ good }) => colony.productionRecord[good] = 0)
			Storage.goods(colony.productionSummary).forEach(({ good }) => colony.productionSummary[good] = Math.round(intermediateProductionRecord[good]))
			Storage.productions(colony.productionSummary).forEach(({ good }) => colony.productionSummary[good] = Math.round(intermediateProductionRecord[good]))
			Storage.update(colony.productionSummary)
		}

		return true
	}

	return {
		update
	}
}

export default { create }