import Time from 'timeline/time'
import Settlement from 'entity/settlement'

const SETTLEMENT_PRODUCTION = 1.0 / Time.PRODUCTION_BASE_TIME
const create = settlement => {
	let lastUpdate = null
	const update = currentTime => {
		if (!lastUpdate) {
			lastUpdate = currentTime
			return true
		}

		const deltaTime = currentTime - lastUpdate
		lastUpdate = currentTime
	
		const amount = SETTLEMENT_PRODUCTION * settlement.productivity * deltaTime
		Settlement.update.production(settlement, settlement.production + amount)

		return true
	}

	return {
		update
	}
}

export default { create }