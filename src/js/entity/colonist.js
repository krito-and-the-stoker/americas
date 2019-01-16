import Buildings from '../data/buildings.json'
import Building from '../entity/building'
import Harvest from '../task/harvest'
import Produce from '../task/produce'
import Teach from '../task/teach'
import Time from '../timeline/time'
import Record from '../util/record'
import Binding from '../util/binding'
import Colony from './colony'
import Util from '../util/util'
import Unit from '../entity/unit'
import UnjoinColony from '../action/unjoinColony'


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

	const position = colonist.colony.colonists
		.filter(col => col.work && col.work.building === building)
		.map(col => col.work.position)
		.reduce((free, occupied) => free.filter(pos => pos !== occupied), Util.range(Building.workspace(colonist.colony, building)))
		.find(() => true)

	const stop = building === 'school' ? 
		Time.schedule(Teach.create(colonist)) :
		Time.schedule(Produce.create(colonist.colony, building, colonist))
	update.work(colonist, {
		type: 'Building',
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
	update.work(colonist, null)
}

const listen = {
	work: (colonist, fn) => Binding.listen(colonist, 'work', fn),
	colony: (colonist, fn) => Binding.listen(colonist, 'colony', fn),
	expert: (colonist, fn) => Binding.listen(colonist, 'expert', fn),
}
const update = {
	work: (colonist, value) => Binding.update(colonist, 'work', value),
	colony: (colonist, value) => Binding.update(colonist, 'colony', value),
	expert: (colonist, value) => Binding.update(colonist, 'expert', value),
}

const create = unit => {
	const colonist = {
		type: 'colonist',
		unit,
		expert: unit.expert,
		education: {
			profession: null,
			progress: 0
		},
		work: null
	}

	Record.add('colonist', colonist)
	return colonist
}

const disband = colonist => {
	UnjoinColony(colonist)
	if (colonist.unit) {
		Unit.update.colonist(colonist.unit, null)
	}

	Record.remove(colonist)
}

const save = colonist => ({
	colony: Record.reference(colonist.colony),
	unit: Record.reference(colonist.unit),
	expert: colonist.expert,
	education: colonist.education,
	work: colonist.work ? {
		type: colonist.work.type,
		good: colonist.work.good,
		building: colonist.work.building,
		position: colonist.work.position,
		tile: Record.referenceTile(colonist.work.tile)
	} : null
})

const load = colonist => {
	colonist.type = 'colonist'

	colonist.colony = Record.dereference(colonist.colony)
	colonist.unit = Record.dereference(colonist.unit)

	Record.entitiesLoaded(() => {	
		if (colonist.work) {
			if (colonist.work.type === 'Field') {			
				colonist.work.tile = Record.dereferenceTile(colonist.work.tile)
				colonist.work.tile.harvestedBy = null
				colonist.work.stop = Time.schedule(Harvest.create(colonist.colony, colonist.work.tile, colonist.work.good, colonist))
			} 
			if (colonist.work.type === 'Building') {
				if (colonist.work.building === 'school') {
					colonist.work.stop = Time.schedule(Teach.create(colonist))
				} else {
					colonist.work.stop = Time.schedule(Produce.create(colonist.colony, colonist.work.building, colonist))
				}
			}
		}
	})

	return colonist
}

export default {
	create,
	disband,
	save,
	load,
	beginFieldWork,
	beginColonyWork,
	stopWorking,
	listen,
	update,
}