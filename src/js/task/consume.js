import Time from 'timeline/time'

import Storage from 'entity/storage'


const PRODUCTION_BASE_FACTOR = 1.0 / Time.PRODUCTION_BASE_TIME


const create = (colony, good, amount) => {
	const update = (currentTime, deltaTime) => {
		const finalAmount = -deltaTime * amount * PRODUCTION_BASE_FACTOR

		if (good !== 'bells' || colony.bells >= finalAmount) {		
			Storage.update(colony.storage, { good, amount: finalAmount })
			Storage.update(colony.productionRecord, { good, amount: -amount })
		}
		// console.log('consume', { good, amount: -amount })

		return true
	}

	return {
		update,
		sort: 2
	}	
}

export default { create }