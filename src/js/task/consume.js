import Colony from '../entity/colony'
import Time from '../timeline/time'

const PRODUCTION_BASE_FACTOR = 1.0 / Time.PRODUCTION_BASE_TIME

const create = (colony, good, amount) => {
	let lastUpdate = null
	const update = currentTime => {
		if (!lastUpdate) {
			lastUpdate = currentTime
			return true
		}

		const deltaTime = currentTime - lastUpdate
		const finalAmount = -deltaTime * amount * PRODUCTION_BASE_FACTOR
		Colony.updateStorage(colony, good, finalAmount)

		lastUpdate = currentTime
		return true
	}

	return {
		update
	}	
}

export default { create }