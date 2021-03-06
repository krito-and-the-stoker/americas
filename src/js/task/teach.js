import Time from 'timeline/time'

import Events from 'util/events'

import Storage from 'entity/storage'
import Colonist from 'entity/colonist'
import Colony from 'entity/colony'
import Unit from 'entity/unit'


const TEACH_BASE_FACTOR = 1.0 / Time.TEACH_BASE_TIME

const testFieldWork = (student, good) => student.work && student.work.type === 'Field' && student.work.good === good
const testBuildingWork = (student, building) => student.work && student.work.type === 'Building' && student.work.building === building
const willLearn = {
	farmer: student => testFieldWork(student, 'food') && student.work.tile.domain === 'land',
	fisher: student => testFieldWork(student, 'food') && student.work.tile.domain === 'sea',
	sugarplanter: student => testFieldWork(student, 'sugar'),
	tobaccoplanter: student => testFieldWork(student, 'tobacco'),
	cottonplanter: student => testFieldWork(student, 'cotton'),
	furtrapper: student => testFieldWork(student, 'furs'),
	lumberjack: student => testFieldWork(student, 'wood'),
	oreminer: student => testFieldWork(student, 'ore'),
	silverminer: student => testFieldWork(student, 'silver'),
	distiller: student => testBuildingWork(student, 'rumDistillers'),
	tobacconist: student => testBuildingWork(student, 'tobacconists'),
	weaver: student => testBuildingWork(student, 'weavers'),
	furtrader: student => testBuildingWork(student, 'furTraders'),
	blacksmith: student => testBuildingWork(student, 'blacksmiths'),
	gunsmith: student => testBuildingWork(student, 'gunsmiths'),
	carpenter: student => testBuildingWork(student, 'carpenters'),
	statesman: student => testBuildingWork(student, 'townhall'),
	preacher: student => testBuildingWork(student, 'church')
}

const create = teacher => {
	const update = (currentTime, deltaTime) => {
		const scale = deltaTime * TEACH_BASE_FACTOR

		if (!teacher.colony) {
			return true
		}

		const profession = teacher.expert
		if (!profession) {
			return false
		}
		teacher.colony.colonists
			.filter(student => !student.expert)
			.filter(willLearn[profession])
			.forEach(student => {
				if (student.education.profession !== profession) {
					student.education.profession = teacher.expert
					student.education.progress = 0
				}
				student.education.progress += scale
				if (student.education.progress >= Colony.expertLevel[profession]) {
					Colonist.update.expert(student, student.education.profession)
					Unit.update.expert(student.unit, student.education.profession)
					Events.trigger('notification', { type: 'learned', colonist: student, colony: teacher.colony })
				}
				Storage.update(teacher.colony.productionRecord, { good: 'books', amount: 1 })
			})

		teacher.colony.colonists
			.filter(student => student.expert === 'criminal' || student.expert === 'servant')
			.filter(willLearn[profession])
			.forEach(student => {
				student.education.progress += scale
				if (student.education.progress >= 1) {
					Colonist.update.expert(student, student.expert === 'criminal' ? 'servant' : null)
					Unit.update.expert(student.unit, student.expert === 'criminal' ? 'servant' : null)
					Events.trigger('notification', { type: 'learned', colonist: student, colony: teacher.colony })
				}
				Storage.update(teacher.colony.productionRecord, { good: 'books', amount: 1 })
			})

		return true
	}

	return {
		update
	}
}

export default { create }