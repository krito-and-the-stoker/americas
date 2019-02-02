import Time from 'timeline/time'

import Record from 'util/record'

import Unit from 'entity/unit'
import Colonist from 'entity/colonist'
import Colony from 'entity/colony'

// import Notification from 'view/ui/notification'


const TEACH_BASE_FACTOR = 1.0 / Time.TEACH_BASE_TIME


const create = (unit, profession) => {
	if (!unit.colonist) {
		Unit.update.colonist(unit, Colonist.create(unit))
	}
	const student = unit.colonist

	const init = () => {
		Unit.update.offTheMap(unit, true)
		return true
	}
	
	const update = (currentTime, deltaTime) => {
		const scale = deltaTime * TEACH_BASE_FACTOR
		if (student.education.profession !== profession) {
			student.education.profession = profession
			student.education.progress = 0
		}
		student.education.progress += 3 * scale
		if (student.education.progress >= Colony.expertLevel[profession]) {
			return false
		}

		return true
	}

	const finished = () => {
		Colonist.update.expert(student, student.education.profession)
		Notification.create({ type: 'learned', unit })
		Unit.update.offTheMap(unit, false)
	}

	const save = () => ({
		type: 'learnFromNatives',
		unit: Record.reference(unit),
		profession
	})

	const learnFromNatives = {
		init,
		update,
		finished,
		save
	}

	return learnFromNatives
}

const load = data => {
	const unit = Record.dereference(data.unit)
	return create(unit, data.profession)
}

export default { create, load }