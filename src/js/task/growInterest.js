import Time from 'timeline/time'

import Settlement from 'entity/settlement'


const INTEREST_GROWTH_FACTOR = 1.0 / Time.PRODUCTION_BASE_TIME
const create = (settlement, amount) => {
	return {
		update: (currentTime, deltaTime) => {
			Settlement.update.interest(settlement, settlement.interest + deltaTime * INTEREST_GROWTH_FACTOR * amount)
			return true
		}
	}
}

export default { create }