import Harvest from '../task/harvest'
import Consume from '../task/consume'
import Time from '../timeline/time'
import ColonistView from '../view/colonist'
import Record from '../util/record'

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

	Record.add('colonist', colonist)
	return colonist
}

const save = colonist => ({
	colony: Record.reference(colonist.colony),
	unit: Record.reference(colonist.unit),
	expert: colonist.expert,
	worksAt: colonist.worksAt ? {
		type: colonist.worksAt.type,
		good: colonist.worksAt.good,
		tile: Record.referenceTile(colonist.worksAt.tile)
	} : null
})

const load = colonist => {
	colonist.sprite = ColonistView.create(colonist)
	Time.schedule(Consume.create(colony, 'food', 2))
	return colonist
}


export default {
	create,
	save,
	load,
	beginFieldWork
}