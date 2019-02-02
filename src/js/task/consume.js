import Time from 'timeline/time'

import Storage from 'entity/storage'


const PRODUCTION_BASE_FACTOR = 1.0 / Time.PRODUCTION_BASE_TIME


const create = (colony, good, amount) => {
	const update = (currentTime, deltaTime) => {
		const finalAmount = -deltaTime * amount * PRODUCTION_BASE_FACTOR
		Storage.update(colony.storage, { good, amount: finalAmount })
		Storage.update(colony.productionRecord, { good, amount: finalAmount })

		return true
	}

	return {
		update
	}	
}

export default { create }