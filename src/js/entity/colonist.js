import Record from 'util/record'
import Binding from 'util/binding'
import Util from 'util/util'

import Tile from 'entity/tile'
import Unit from 'entity/unit'
import Building from 'entity/building'

import Time from 'timeline/time'

import Harvest from 'task/harvest'
import Produce from 'task/produce'
import Teach from 'task/teach'
import Learn from 'task/learn'

import UnjoinColony from 'interaction/unjoinColony'


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
			Tile.update.harvestedBy(colonist.work.tile, null)
		}
	}
	update.work(colonist, null)
}

const listen = {
	work: (colonist, fn) => Binding.listen(colonist, 'work', fn),
	colony: (colonist, fn) => Binding.listen(colonist, 'colony', fn),
	expert: (colonist, fn) => Binding.listen(colonist, 'expert', fn),
	unit: (colonist, fn) => Binding.listen(colonist, 'unit', fn),
	beingEducated: (colonist, fn) => Binding.listen(colonist, 'beingEducated', fn),
}
const update = {
	work: (colonist, value) => Binding.update(colonist, 'work', value),
	colony: (colonist, value) => Binding.update(colonist, 'colony', value),
	expert: (colonist, value) => Binding.update(colonist, 'expert', value),
	unit: (colonist, value) => Binding.update(colonist, 'unit', value),
	beingEducated: (colonist, value) => Binding.update(colonist, 'beingEducated', value),
}

const initialize = colonist => {
	return [
		listen.unit(colonist, unit => {
			if (!unit) {
				disband(colonist)
			}
		}),
		Time.schedule(Learn.create(colonist))
	]
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
		power: Math.random(),
		mood: 0,
		work: null,
		beingEducated: false
	}

	colonist.destroy = initialize(colonist)

	Record.add('colonist', colonist)
	return colonist
}

const power = colonist => {
	return colonist.mood + colonist.power
}

const disband = colonist => {
	if (colonist.colony) {
		UnjoinColony(colonist)
	}
	if (colonist.unit) {
		Unit.update.colonist(colonist.unit, null)
	}

	Util.execute(colonist.destroy)
	Record.remove(colonist)
}

const save = colonist => ({
	colony: Record.reference(colonist.colony),
	unit: Record.reference(colonist.unit),
	expert: colonist.expert,
	education: colonist.education,
	power: colonist.power,
	mood: colonist.mood,
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
	colonist.power = colonist.power || Math.random()
	colonist.mood = colonist.mood || 0

	Record.entitiesLoaded(() => {	
		initialize(colonist)
		if (colonist.work) {
			if (colonist.work.type === 'Field') {			
				colonist.work.tile = Record.dereferenceTile(colonist.work.tile)
				Tile.update.harvestedBy(colonist.work.tile, null)
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
	power,
	listen,
	update,
}