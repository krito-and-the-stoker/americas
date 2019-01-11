import Buildings from '../data/buildings.json'
import Harvest from '../task/harvest'
import Produce from '../task/produce'
import Time from '../timeline/time'
import Record from '../util/record'
import Binding from '../util/binding'
import Colony from './colony'
import Util from '../util/util'


const beginFieldWork = (colonist, tile, good) => {
	stopWorking(colonist)
	const colony = colonist.colony
	const stop = Time.schedule(Harvest.create(colony, tile, good, colonist))

	update.work(colonist, {
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
		.filter(col => col.work && col.work.building === building)
		.map(col => col.work.position)
		.reduce((free, occupied) => free.filter(pos => pos !== occupied), Util.range(Buildings[building].workspace))
		.find(() => true)
	update.work(colonist, {
		type: 'Colony',
		building,
		position,
		stop
	})
}

const stopWorking = colonist => {
	if (colonist.work) {
		colonist.work.stop()
		if (colonist.work.tile) {
			colonist.work.tile.harvestedBy = null
		}
	}
	update.work(colonist)
}

const listen = {
	work: (colonist, fn) => Binding.listen(colonist, 'work', fn),
	colony: (colonist, fn) => Binding.listen(colonist, 'colony', fn),
}
const update = {
	work: (colonist, value) => Binding.update(colonist, 'work', value),
	colony: (colonist, value) => Binding.update(colonist, 'colony', value),
}

const create = unit => {
	const colonist = {
		type: 'colonist',
		unit,
		expert: unit.expert,
		work: null
	}

	Record.add('colonist', colonist)
	return colonist
}

const save = colonist => ({
	colony: Record.reference(colonist.colony),
	unit: Record.reference(colonist.unit),
	expert: colonist.expert,
	work: colonist.work ? {
		type: colonist.work.type,
		good: colonist.work.good,
		tile: Record.referenceTile(colonist.work.tile)
	} : null
})

const load = colonist => {
	colonist.type = 'colonist'

	colonist.colony = Record.dereference(colonist.colony)
	colonist.unit = Record.dereference(colonist.unit)

	Record.entitiesLoaded(() => {	
		if (colonist.work) {
			colonist.work.tile = Record.dereferenceTile(colonist.work.tile)
			colonist.work.tile.harvestedBy = null
			colonist.work.stop = Time.schedule(Harvest.create(colonist.colony, colonist.work.tile, colonist.work.good, colonist))
		}
	})

	return colonist
}

export default {
	create,
	save,
	load,
	beginFieldWork,
	beginColonyWork,
	stopWorking,
	listen,
	update,
}