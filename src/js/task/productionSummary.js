import Time from '../timeline/time'
import Storage from '../entity/storage'
import Task from '../util/task'

const PRODUCTION_BASE_FACTOR = 1.0 / Time.PRODUCTION_BASE_TIME

const create = colony => {
	let lastUpdate = null
	let lastTimeCalled = null
	let count = -1
	const update = currentTime => {
		if (!lastUpdate) {
			lastUpdate = currentTime
			lastTimeCalled = currentTime
			return true
		}

		const deltaTime = currentTime - lastUpdate
		const deltaTimeCalled = currentTime - lastTimeCalled
		const scale = deltaTime * PRODUCTION_BASE_FACTOR
		lastTimeCalled = currentTime
		
		if (deltaTimeCalled > 0) {
			count += 1
			if (count > 10) {
				Storage.goods(colony.productionSummary).forEach(({ good }) => colony.productionSummary[good] = 0)
				Storage.productions(colony.productionSummary).forEach(({ good }) => colony.productionSummary[good] = 0)
				Storage.goods(colony.productionRecord).forEach(({ good, amount }) => colony.productionRecord[good] = Math.round(amount / scale))
				Storage.productions(colony.productionRecord).forEach(({ good, amount }) => colony.productionRecord[good] = Math.round(amount / scale))
				Storage.transferWithProduction(colony.productionRecord, colony.productionSummary)
				lastUpdate = currentTime
				count = 0
			}
		}

		return true
	}

	return {
		update: Task.batch(update)
	}
}

export default { create }