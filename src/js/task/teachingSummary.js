import Colonist from 'entity/colonist'

const create = colony => {
	const lastEducationProgress = {}
	const update = () => {
		colony.colonists.forEach(colonist => {
			if (lastEducationProgress[colonist.referenceId]) {
				if (lastEducationProgress[colonist.referenceId] < colonist.education.progress) {
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