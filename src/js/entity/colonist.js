import Harvest from '../task/harvest'
import Consume from '../task/consume'
import Time from '../timeline/time'
import ColonistView from '../view/colonist'
import Record from '../util/record'
import Util from '../util/util'

const worksAt = Util.binding('worksAt')


const beginFieldWork = (colonist, tile, good) => {
	const colony = colonist.colony
	if (colonist.worksAt) {
		colonist.worksAt.stop()
		colonist.worksAt.tile.harvestedBy = null
	}


	const stop = Time.schedule(Harvest.create(colony, tile, good, colonist))

	worksAt.update(colonist, {
		type: 'Field',
		tile,
		good,
		stop
	})
}

const bindWorksAt = worksAt.bind

const create = (colony, unit) => {
	const colonist = {
		type: 'colonist',
		colony,
		unit,
		expert: unit.expert,
		worksAt: null
	}
	worksAt.init(colonist)
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
	worksAt.init(colonist)
	colonist.type = 'colonist'
	colonist.sprite = ColonistView.create(colonist)

	colonist.colony = Record.dereference(colonist.colony)
	colonist.unit = Record.dereference(colonist.unit)

	Record.entitiesLoaded(() => {	
		if (colonist.worksAt) {
			colonist.worksAt.tile = Record.dereferenceTile(colonist.worksAt.tile)
			colonist.worksAt.tile.harvestedBy = null
			colonist.worksAt.stop = Time.schedule(Harvest.create(colonist.colony, colonist.worksAt.tile, colonist.worksAt.good, colonist))
		}

		Time.schedule(Consume.create(colonist.colony, 'food', 2))
	})

	return colonist
}

const is = entity => entity.type === 'colonist'

export default {
	create,
	is,
	save,
	load,
	beginFieldWork,
	bindWorksAt
}