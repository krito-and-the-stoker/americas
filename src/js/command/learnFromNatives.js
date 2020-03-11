import Time from 'timeline/time'

import Events from 'util/events'

import Unit from 'entity/unit'
import Colonist from 'entity/colonist'
import Colony from 'entity/colony'
import Storage from 'entity/storage'

import Factory from 'command/factory'


const TEACH_BASE_FACTOR = 1.0 / Time.TEACH_BASE_TIME

export default Factory.create('LearnFromNatives', {
	unit: {
		type: 'entity',
		required: true
	},
	profession: {
		type: 'raw',
		required: true
	}
}, {
	id: 'LearnFromNatives',
	display: 'Learning from natives'
}, ({ unit, profession }) => {
	let wantsToLearn = true
	if (!unit.colonist) {
		Unit.update.colonist(unit, Colonist.create(unit))
	}
	const student = unit.colonist

	const init = () => {
		Unit.update.offTheMap(unit, true)
	}
	
	const update = (currentTime, deltaTime) => {
		// support unit when living with the natives
		unit.equipment.food = Unit.UNIT_FOOD_CAPACITY
		Storage.update(unit.equipment)

		const scale = deltaTime * TEACH_BASE_FACTOR
		if (student.education.profession !== profession) {
			student.education.profession = profession
			student.education.progress = 0
		}
		student.education.progress += 2 * scale
		if (student.education.progress >= Colony.expertLevel[profession]) {
			return false
		}

		return wantsToLearn
	}

	const finished = () => {
		if (wantsToLearn) {		
			Colonist.update.expert(student, student.education.profession)
			Unit.update.expert(student.unit, student.education.profession)
			Events.trigger('notification', { type: 'learned', unit })
		}
		Unit.update.offTheMap(unit, false)
	}

	const cancel = () => {
		wantsToLearn = false
	}

	return {
		init,
		update,
		finished,
		cancel
	}
})
