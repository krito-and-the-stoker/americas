import Time from 'timeline/time'



const PRODUCTION_BASE_FACTOR = 1.0 / Time.PRODUCTION_BASE_TIME
// .2% trust gain every production cycle
const TRUST_GAIN = 0.01

const create = settlement => {
	const update = (currentTime, deltaTime) => {
		settlement.owner.ai.state.relations[settlement.mission.referenceId].trust += deltaTime * PRODUCTION_BASE_FACTOR * TRUST_GAIN
		return true
	}

	return {
		update,
	}
}

export default { create }