import Goods from '../data/goods.json'
import Buildings from '../data/buildings.json'

import MapEntity from '../entity/map'
import Tile from '../entity/tile'
import Harvest from '../task/harvest'
import Time from '../timeline/time'
import Util from '../util/util'
import Colonist from '../entity/colonist'
import Record from '../util/record'
import UnitView from '../view/unit'
import Unit from './unit'
import Binding from '../util/binding'
import Storage from './storage'
import Consume from '../task/consume'
import Deteriorate from '../task/deteriorate'
import Member from '../util/member'

// for unknown reasons we need to wait bit until we can set the global here :/
setTimeout(() => Record.setGlobal('colonyNames',
	['Jamestown',
	'Roanoke',
	'Virginia',
	"Cuper's Cove",
	"St. John's",
	'Henricus',
	'Delaware',
	'Pennsylvania',
	'Massachusetts Bay Colony',
	'Maine',
	'New Jersey',
	'Connecticut',
	'Maryland',
	'South Carolina',
	'New Hampshire',
	'North Carolina',
	'Rhode Island']), 0)

const getColonyName = () => {
	let colonyNames = Record.getGlobal('colonyNames')
	const name = colonyNames.shift()
	Record.setGlobal('colonyNames', colonyNames)
	return name
}

const add = {
	unit: (colony, unit) => Member.add(colony, 'units', unit),
	colonist: (colony, colonist) => Member.add(colony, 'colonists', colonist)
}

const remove = {
	unit: unit => Member.remove(unit.colony, 'units', unit),
	colonist: colonist => Member.remove(colonist.colony, 'colonists', colonist)
}

const listen = {
	units: (colony, fn) => Binding.listen(colony, 'units', fn),
	colonists: (colony, fn) => Binding.listen(colony, 'colonists', fn)
}

const canEmploy = (colony, building) => colony.colonists
	.filter(colonist => colonist.work && colonist.work.building === building).length < Buildings[building].workspace


const initialize = colony => {
	const tile = MapEntity.tile(colony.mapCoordinates)
	Tile.listen(tile, () => Tile.colonyProductionGoods(tile).forEach(good => Time.schedule(Harvest.create(colony, tile, good))))
	Binding.listen(colony, 'colonists', colonists => Time.schedule(Consume.create(colony, 'food', 2 * colonists.length)))
	bindStorage(colony, storage => {
		if (storage.food >= 200) {
			const unit = Unit.create('settler', colony.mapCoordinates)
			updateStorage(colony, 'food', -200)
		}
	})
	Time.schedule(Deteriorate.create(colony))
}

const create = (coords, unit) => {
	const colony = {
		name: getColonyName(),
		units: [],
		colonists: [],
		capacity: 100,
		mapCoordinates: { ...coords }
	}
	colony.storage = Storage.create()

	// TODO: does the tile need to know about the colony?
	const tile = MapEntity.tile(coords)
	tile.colony = colony

	// TODO: this is the wrong place for that
	const colonist = Colonist.create(colony, unit)
	const winner = Tile.diagonalNeighbors(tile)
		.filter(neighbor => !neighbor.harvestedBy)
		.reduce((winner, neighbor) => {
			const production = Tile.production(neighbor, 'food', colonist)
			return production > winner.production ? {
				production,
				tile: neighbor
			 } : winner
		},
		{ production: -1 })
	if (winner.tile) {
		Colonist.beginFieldWork(colonist, winner.tile, 'food')
	}


	initialize(colony)

	Record.add('colony', colony)
	return colony
}

const save = colony => ({
	name: colony.name,
	units: colony.units.map(unit => Record.reference(unit)),
	colonists: colony.colonists.map(colonist => Record.reference(colonist)),
	capacity: colony.capacity,
	mapCoordinates: colony.mapCoordinates,
	storage: colony.storage,
})

const load = colony => {
	const tile = MapEntity.tile(colony.mapCoordinates)
	tile.colony = colony
	Record.entitiesLoaded(() => initialize(colony))

	colony.sprite = ColonyView.createMapSprite(colony)

	colony.colonists.forEach((colonist, index) => Record.dereferenceLazy(colonist, entity => colony.colonists[index] = entity))
	colony.units.forEach((unit, index) => Record.dereferenceLazy(unit, entity => colony.units[index] = entity))
	return colony	
}

const coastalDirection = colony => {
	const center = MapEntity.tile(colony.mapCoordinates)
	const winner = Tile.diagonalNeighbors(center)
		.filter(neighbor => neighbor.coast)
		.map(neighbor => ({
			score: Tile.diagonalNeighbors(neighbor).filter(nn => nn.coast && Tile.diagonalNeighbors(center).includes(nn)).length + 1,
			tile: neighbor
		}))
		.reduce((winner, { tile, score }) => winner.score > score ? winner : { tile, score }, { score: 0 })

	return winner.score > 0 ? Tile.neighborString(center, winner.tile) : null
}

export default {
	create,
	save,
	load,
	coastalDirection,
	add,
	remove,
	listen
}