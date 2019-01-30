import Time from 'timeline/time'
import Settlement from 'entity/settlement'

const TENSION_GROWTH_FACTOR = 0.3 / Time.PRODUCTION_BASE_TIME
const create = (settlement, amount) => {
	return {
		update: (currentTime, deltaTime) => {
			Settlement.update.tension(settlement, settlement.tension + deltaTime * TENSION_GROWTH_FACTOR * amount)
			return true
		}
	}
}

export default { create }