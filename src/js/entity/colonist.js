import Harvest from '../task/harvest'
import Consume from '../task/consume'
import Time from '../timeline/time'
import ColonistView from '../view/colonist'

const beginFieldWork = (colony, tile, good, colonist) => {
	if (colonist.worksAt) {
		colonist.worksAt.stop()
	}


	const stop = Time.schedule(Harvest.create(colony, tile, good, colonist))

	colonist.worksAt = {
		type: 'Field',
		tile,
		good,
		stop
	}
}

const create = (colony, unit) => {
	const colonist = {
		colony,
		unit,
		expert: unit.expert,
		worksAt: null
	}
	colonist.sprite = ColonistView.create(colonist)

	Time.schedule(Consume.create(colony, 'food', 2))

	return colonist
}


export default {
	create,
	beginFieldWork
}