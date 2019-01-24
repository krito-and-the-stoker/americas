import Time from 'timeline/time'
import Europe from 'entity/europe'
import Storage from 'entity/storage'
import Colony from 'entity/colony'

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
		lastUpdate = currentTime

		Europe.update.crosses(scale)
		Storage.update(colony.productionRecord, { good: 'crosses', amount: scale })
		Colony.update.bells(colony, scale)
		Storage.update(colony.productionRecord, { good: 'bells', amount: scale })

		return true
	}


	return {
		update
	}	
}

export default {
	create
}