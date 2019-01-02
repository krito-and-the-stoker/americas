import Colony from '../entity/colony'


const PRODUCTION_BASE_FACTOR = 0.0001

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