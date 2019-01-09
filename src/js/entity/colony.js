import Goods from '../data/goods.json'

import ColonyView from '../view/colony'
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

const updateStorage = (colony, good, amount) => Storage.update(colony, good, amount)
const bindStorage = (colony, fn) => Storage.listen(colony, fn)


const enter = (colony, unit) => {
	colony.units.push(unit)
	unit.colony = colony
	Unit.unloadAllUnits(unit)
	UnitView.deactivate(unit)
	Binding.update(colony, 'units')
}
const leave = (colony, unit) => {
	unit.colony = null
	Binding.update(colony, 'units', colony.units.filter(u => u !== unit))
}

const join = (colony, colonist) => {
	if (!colony.colonists.includes(colonist)) {	
		colony.colonists.push(colonist)
		Binding.update(colony, 'colonists')
	}
}
const unjoin = (colony, colonist) => {
	Colonist.stopWorking(colonist)
	Binding.update(colony, 'colonists', colony.colonists.filter(col => col !== colonist))
}

const bindUnits = (colony, fn) => Binding.listen(colony, 'units', fn)
const bindColonists = (colony, fn) => Binding.listen(colony, 'colonists', fn)

const create = (coords, unit) => {
	const colony = {
		name: getColonyName(),
		units: [],
		colonists: [],
		mapCoordinates: { ...coords }
	}
	colony.storage = Storage.create(colony)
	const tile = MapEntity.tile(coords)
	tile.colony = colony
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

	Tile.listen(tile, () => Tile.colonyProductionGoods(tile).forEach(good => Time.schedule(Harvest.create(colony, tile, good))))
	Binding.listen(colony, 'colonists', colonists => Time.schedule(Consume.create(colony, 'food', 2 * colonists.length)))


	colony.sprite = ColonyView.createMapSprite(colony)

	Record.add('colony', colony)
	return colony
}

const save = colony => ({
	name: colony.name,
	storage: colony.storage,
	mapCoordinates: colony.mapCoordinates,
	colonists: colony.colonists.map(colonist => Record.reference(colonist)),
	units: colony.units.map(unit => Record.reference(unit))
})

const load = colony => {
	const tile = MapEntity.tile(colony.mapCoordinates)
	tile.colony = colony
	Record.entitiesLoaded(() => {
		Tile.listen(tile, () => Tile.colonyProductionGoods(tile).forEach(good => Time.schedule(Harvest.create(colony, tile, good))))
		Binding.listen(colony, 'colonists', colonists => Time.schedule(Consume.create(colony, 'food', 2 * colonists.length)))
	})

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
	updateStorage,
	bindStorage,
	bindUnits,
	bindColonists,
	enter,
	leave,
	join,
	unjoin
}