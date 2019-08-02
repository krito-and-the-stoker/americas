import Time from 'timeline/time'

import Events from 'util/events'

import Colonist from 'entity/colonist'
import Unit from 'entity/unit'



const LEARN_BASE_FACTOR = 1.0 / Time.LEARN_BASE_TIME

const testFieldWork = (work, good) => work && work.type === 'Field' && work.good === good
const testBuildingWork = (work, building) => work && work.type === 'Building' && work.building === building
const willLearn = {
	farmer: work => testFieldWork(work, 'food') && work.tile.domain === 'land',
	fisher: work => testFieldWork(work, 'food') && work.tile.domain === 'sea',
	sugarplanter: work => testFieldWork(work, 'sugar'),
	tobaccoplanter: work => testFieldWork(work, 'tobacco'),
	cottonplanter: work => testFieldWork(work, 'cotton'),
	furtrapper: work => testFieldWork(work, 'furs'),
	lumberjack: work => testFieldWork(work, 'wood'),
	oreminer: work => testFieldWork(work, 'ore'),
	silverminer: work => testFieldWork(work, 'silver'),
	distiller: work => testBuildingWork(work, 'rumDistillers'),
	tobacconist: work => testBuildingWork(work, 'tobacconists'),
	weaver: work => testBuildingWork(work, 'weavers'),
	furtrader: work => testBuildingWork(work, 'furTraders'),
	blacksmith: work => testBuildingWork(work, 'blacksmiths'),
	gunsmith: work => testBuildingWork(work, 'gunsmiths'),
	carpenter: work => testBuildingWork(work, 'carpenters'),
	statesman: work => testBuildingWork(work, 'townhall'),
	preacher: work => testBuildingWork(work, 'church')
}


const create = colonist => {
	let profession = null
	const unsubscribe = Colonist.listen.work(colonist, work => {
		profession = Object.entries(willLearn).reduce((result, [prof, test]) => test(work) ? prof : result, null)
		if (profession && profession !== colonist.education.profession) {
			colonist.education.profession = profession
			colonist.education.progress = 0
		}
	})

	const update = (currentTime, deltaTime) => {
		if (profession && profession !== colonist.expert) {
			const amount = deltaTime * LEARN_BASE_FACTOR
			colonist.education.progress += amount

			if (colonist.education.progress >= 1) {
				const expert = colonist.expert === 'criminal' ? 'servant' :
					(colonist.expert === 'servant' ? null : profession)

				Colonist.update.expert(colonist, expert)
				Unit.update.expert(colonist.unit, expert)
				Events.trigger('notification', { type: 'learned', colonist: colonist, colony: colonist.colony })
			}
		}

		return true
	}

	return {
		update,
		finished: unsubscribe,
		sort: 1
	}
}

export default { create }