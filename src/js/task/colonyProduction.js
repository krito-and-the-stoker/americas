import Time from 'timeline/time'

import Europe from 'entity/europe'
import Storage from 'entity/storage'
import Colony from 'entity/colony'


const PRODUCTION_BASE_FACTOR = 1.0 / Time.PRODUCTION_BASE_TIME

const COLONY_BASE_CROSSES = 1
const COLONY_BASE_BELLS = 1


const create = colony => {
	const update = (currentTime, deltaTime) => {
		const scale = deltaTime * PRODUCTION_BASE_FACTOR

		Europe.update.crosses(COLONY_BASE_CROSSES * scale)
		Storage.update(colony.productionRecord, { good: 'crosses', amount: COLONY_BASE_CROSSES })
		Colony.update.bells(colony, COLONY_BASE_BELLS * scale)
		Storage.update(colony.productionRecord, { good: 'bells', amount: COLONY_BASE_BELLS })
		if (colony.storage.food > 0) {
			Colony.update.growth(colony, colony.colonists.length * scale)
		}

		return true
	}


	return {
		update,
		sort: 1,
	}	
}

export default {
	create
}