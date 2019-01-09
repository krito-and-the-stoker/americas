import Harvest from '../task/harvest'
import Produce from '../task/produce'
import Time from '../timeline/time'
import ColonistView from '../view/colonist'
import Record from '../util/record'
import Binding from '../util/binding'
import Colony from './colony'



const beginFieldWork = (colonist, tile, good) => {
	stopWorking(colonist)
	const colony = colonist.colony
	const stop = Time.schedule(Harvest.create(colony, tile, good, colonist))

	Binding.update(colonist, 'worksAt', {
		type: 'Field',
		tile,
		good,
		stop
	})
}

const beginColonyWork = (colonist, building) => {
	stopWorking(colonist)
	const stop = Time.schedule(Produce.create(colonist.colony, building, colonist))

	const position = colonist.colony.colonists
		.filter(col => col.worksAt && col.worksAt.building === building)
		.map(col => col.worksAt.position)
		.reduce((free, occupied) => free.filter(pos => pos !== occupied), [0, 1, 2])
		.find(() => true)
	Binding.update(colonist, 'worksAt', {
		type: 'Colony',
		building,
		position,
		stop
	})
}

const stopWorking = colonist => {
	if (colonist.worksAt) {
		colonist.worksAt.stop()
		if (colonist.worksAt.tile) {
			colonist.worksAt.tile.harvestedBy = null
		}
	}
	Binding.update(colonist, 'worksAt')
}

const bindWorksAt = (colonist, fn) => Binding.listen(colonist, 'worksAt', fn)

const create = (colony, unit) => {
	const colonist = {
		type: 'colonist',
		colony,
		unit,
		expert: unit.expert,
		worksAt: null
	}
	colonist.sprite = ColonistView.create(colonist)
	Colony.leave(colony, unit)
	Colony.join(colony, colonist)

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
	beginColonyWork,
	stopWorking,
	bindWorksAt
}