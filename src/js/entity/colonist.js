import Colonists from 'data/colonists'
import Units from 'data/units'
import Goods from 'data/goods'
import Buildings from 'data/buildings'

import Record from 'util/record'
import Binding from 'util/binding'
import Util from 'util/util'

import Tile from 'entity/tile'
import Unit from 'entity/unit'
import Building from 'entity/building'

import Time from 'timeline/time'

import Harvest from 'task/harvest'
import Produce from 'task/produce'

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
		null :
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
	productionModifier: (colonist, fn) => Binding.listen(colonist, 'productionModifier', fn),
	promotionStatus: (colonist, fn) => Binding.listen(colonist, 'promotionStatus', fn),
	beingEducated: (colonist, fn) => Binding.listen(colonist, 'beingEducated', fn),
}
const update = {
	work: (colonist, value) => Binding.update(colonist, 'work', value),
	colony: (colonist, value) => Binding.update(colonist, 'colony', value),
	expert: (colonist, value) => Binding.update(colonist, 'expert', value),
	unit: (colonist, value) => Binding.update(colonist, 'unit', value),
	productionModifier: (colonist, value) => Binding.update(colonist, 'productionModifier', value),
	promotionStatus: (colonist, value) => Binding.update(colonist, 'promotionStatus', value),
	beingEducated: (colonist, value) => Binding.update(colonist, 'beingEducated', value),
}

const initialize = colonist => {
	colonist.productionModifier = 0

	return [
		listen.unit(colonist, unit => {
			if (!unit) {
				disband(colonist)
			}
		})
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
		promotion: {},
		productionModifier: 0,
		power: Math.random(),
		mood: 0,
		work: null,
		beingEducated: false
	}

	colonist.destroy = initialize(colonist)

	Record.add('colonist', colonist)
	return colonist
}

const expertName = colonist => Units.settler.name[colonist.expert] || 'Settler'
const professionName = profession => Units.settler.name[profession] || 'Settler'

const power = colonist => {
	return colonist.mood
		+ colonist.power
		+ (Colonists[profession(colonist)] || Colonists.default).power
		+ (Colonists[colonist.expert] || Colonists.default).power
}

const profession = colonist => {
	if (!colonist.work) {
		return 'settler'
	}

	if (colonist.work.building === 'school') {
		return 'teacher'
	}

  let currentProfession = colonist.work.type === 'Field'
    ? Goods[colonist.work.good].expert
    : Goods[Buildings[colonist.work.building].production.good].expert
  if (currentProfession === 'farmer' && colonist.work.tile.domain === 'sea') {
    currentProfession = 'fisher'
  }	

  return currentProfession
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
	promotion: colonist.promotion,
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

	// load legacy savegames
	colonist.power = colonist.power || Math.random()
	colonist.mood = colonist.mood || 0
	colonist.promotion = colonist.promotion || {}

	Record.entitiesLoaded(() => {	
		initialize(colonist)
		if (colonist.work) {
			if (colonist.work.type === 'Field') {			
				colonist.work.tile = Record.dereferenceTile(colonist.work.tile)
				Tile.update.harvestedBy(colonist.work.tile, null)
				colonist.work.stop = Time.schedule(Harvest.create(colonist.colony, colonist.work.tile, colonist.work.good, colonist))
			} 
			if (colonist.work.type === 'Building') {
				if (colonist.work.building !== 'school') {
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
	profession,
	expertName,
	professionName,
	listen,
	update,
}