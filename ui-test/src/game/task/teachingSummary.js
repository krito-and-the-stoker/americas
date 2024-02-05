import Time from 'timeline/time'

import Colonist from 'entity/colonist'

const LEARN_BASE_FACTOR = 1.0 / Time.LEARN_BASE_TIME


const create = colony => {
	const lastEducationProgress = {}
	const update = (currentTime, deltaTime) => {
		colony.colonists.forEach(colonist => {
			if (lastEducationProgress[colonist.referenceId]) {
				if (lastEducationProgress[colonist.referenceId] + deltaTime * LEARN_BASE_FACTOR < colonist.education.progress) {
					Colonist.update.beingEducated(colonist, true)
				} else {
					Colonist.update.beingEducated(colonist, false)
				}
			}
			lastEducationProgress[colonist.referenceId] = colonist.education.progress
		})

		return true
	}

	return {
		sort: 8,
		update
	}
}


export default { create }