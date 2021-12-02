import Colony from 'data/colony'

import Util from 'util/util'
import Record from 'util/record'
import Binding from 'util/binding'
import Member from 'util/member'
import Events from 'util/events'

import Time from 'timeline/time'

import Unit from 'entity/unit'
import MapEntity from 'entity/map'
import Tile from 'entity/tile'
import Storage from 'entity/storage'
import Building from 'entity/building'
import Trade from 'entity/trade'
import Owner from 'entity/owner'
import Construction from 'entity/construction'

import Harvest from 'task/harvest'
import Consume from 'task/consume'
import ColonistPromotion from 'task/colonistPromotion'
import ColonyProduction from 'task/colonyProduction'
import ProductionSummary from 'task/productionSummary'
import TeachingSummary from 'task/teachingSummary'
import TransferCrosses from 'task/transferCrosses'

import UnjoinColony from 'interaction/unjoinColony'
import LeaveColony from 'interaction/leaveColony'


const getColonyName = () => {
	if (!Record.getGlobal('colonyNames')) {
		Record.setGlobal('colonyNames', Colony.names)		
	}

	let colonyNames = Record.getGlobal('colonyNames')
	const name = colonyNames.shift()
	Record.setGlobal('colonyNames', colonyNames)
	return name
}

const isCoastal = colony => {
	const center = MapEntity.tile(colony.mapCoordinates)
	return Tile.radius(center).some(tile => tile.domain === 'sea')
}

const defender = colony => colony.colonists[colony.colonists.length - 1].unit

const currentConstruction = colony => colony.constructionTarget
	? colony.construction[colony.constructionTarget]
	: colony.construction.none

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
	colonists: (colony, fn) => Binding.listen(colony, 'colonists', fn),
	construction: (colony, fn) => Binding.listen(colony, 'construction', fn),
	constructionTarget: (colony, fn) => Binding.listen(colony, 'constructionTarget', fn),
	bells: (colony, fn) => Binding.listen(colony, 'bells', fn),
	growth: (colony, fn) => Binding.listen(colony, 'growth', fn),
	buildings: (colony, fn) => Binding.listen(colony, 'buildings', fn),
	productionBonus: (colony, fn) => Binding.listen(colony, 'productionBonus', fn),
}

const listenEach = {
	units: (colony, fn) => Member.listenEach(colony, 'units', fn)
}

const update = {
	construction: (colony, value) => Binding.update(colony, 'construction', value),
	constructionTarget: (colony, value) => Binding.update(colony, 'constructionTarget', value),
	buildings: (colony, value) => Binding.update(colony, 'buildings', value),
	bells: (colony, value) => Binding.update(colony, 'bells', colony.bells + value),
	crosses: (colony, value) => Binding.update(colony, 'crosses', colony.crosses + value),
	housing: (colony, value) => Binding.update(colony, 'housing', colony.housing + value),
	growth: (colony, value) => Binding.update(colony, 'growth', colony.growth + value),
	productionBonus: (colony, value) => Binding.update(colony, 'productionBonus', value),
}

const area = (colony, domain) =>
	Tile.radius(MapEntity.tile(colony.mapCoordinates))
		.filter(tile => tile.domain === domain)
		.map(tile => tile.area)
		.find(() => true)

const tories = colony => {
	const colonists = colony.colonists.length
	const percentage = 100 - Math.min(100, Math.round(colony.bells / (colonists + 1)))
	const number = Math.round(colonists * percentage / 100)

	return {
		percentage,
		number
	}
}

const rebels = colony => {
	const tt = tories(colony)
	return {
		percentage: 100 - tt.percentage,
		number: colony.colonists.length - tt.number
	}
}

const expertLevel = {	
	farmer: 1,
	fisher: 1,
	sugarplanter: 1,
	tobaccoplanter: 1,
	cottonplanter: 1,
	furtrapper: 1,
	lumberjack: 1,
	oreminer: 1,
	silverminer: 1,
	distiller: 2,
	tobacconist: 2,
	weaver: 2,
	furtrader: 2,
	blacksmith: 2,
	gunsmith: 2,
	carpenter: 2,
	statesman: 3,
	preacher: 3,
}
const canTeach = (colony, expert) => expert && expertLevel[expert] && expertLevel[expert] <= colony.buildings.school.level
const canEmploy = (colony, building, expert) => colony.colonists
	.filter(colonist => colonist.work && colonist.work.building === building).length < Building.workspace(colony, building) &&
	(building !== 'school' || canTeach(colony, expert))

const initialize = colony => {
	colony.productionSummary = Storage.createWithProduction()
	colony.productionRecord = Storage.createWithProduction()
	const tile = MapEntity.tile(colony.mapCoordinates)

	colony.destroy = [
		Tile.listen.tile(tile, () =>
			Tile.colonyProductionGoods(tile).map(good =>
				Time.schedule(Harvest.create(colony, tile, good)))),
		Time.schedule(ColonistPromotion.create(colony)),
		listen.colonists(colony, colonists =>
			listen.bells(colony, Binding.map(() => rebels(colony).number,
				rebelColonists => Time.schedule(Consume.create(colony, 'bells', rebelColonists))))),
		listenEach.units(colony, (unit, added) => {
			if (added && unit.treasure) {
				Events.trigger('notification', { type: 'treasure', colony, unit })
			}
		}),
		Time.schedule(TeachingSummary.create(colony)),
		Time.schedule(TransferCrosses.create(colony)),
		listen.construction(colony, () => {
			const construction = currentConstruction(colony)
			if (construction.progress > 0 && construction.progress >= Util.sum(Object.values(construction.cost))) {
				Construction.construct(colony, construction)
			}
		}),
		listen.growth(colony, growth => {
			if (growth > 1000) {
				const unit = Unit.create('settler', colony.mapCoordinates, colony.owner)
				const parents = Util.choose(colony.colonists)
				Unit.update.expert(unit, parents.expert)
				Events.trigger('notification', { type: 'born', colony, unit })
				colony.growth = 0
			}
		}),
		Time.schedule(ColonyProduction.create(colony)),
		Time.schedule(ProductionSummary.create(colony)),
		listen.colonists(colony, () => listen.bells(colony, () => {
			let bonus = 0
			if (tories(colony).number > 14) {
				bonus -= 1
			}
			if (tories(colony).number > 9) {
				bonus -= 1
			}
			if (rebels(colony).percentage >= 50) {
				bonus += 1
			}
			if (rebels(colony).percentage >= 100) {
				bonus += 1
			}
			if (colony.productionBonus !== bonus) {
				update.productionBonus(colony, bonus)
			}
		}))
	]
}

const create = (coords, owner) => {
	const colony = {
		name: getColonyName(),
		type: 'colony',
		owner: owner || Owner.player(),
		units: [],
		colonists: [],
		buildings: Building.create(),
		construction: Construction.create(),
		constructionTarget: null,
		mapCoordinates: { ...coords },
		bells: 0,
		crosses: 0,
		housing: 0,
		growth: 0
	}
	colony.storage = Storage.create()
	colony.trade = Storage.create()

	const tile = MapEntity.tile(coords)
	Tile.update.colony(tile, colony)

	initialize(colony)

	Record.add('colony', colony)
	return colony
}

const protection = colony => (Util.max(colony.units
	.filter(unit => unit.domain === 'land')
	.filter(unit => !unit.colonist || !unit.colonist.colony)
	.map(unit => Unit.strength(unit) - 1)) + 1) * (colony.buildings.fortifications.level + 1)

const disband = colony => {
	colony.disbanded = true
	colony.colonists.forEach(UnjoinColony)
	colony.units.forEach(LeaveColony)
	const tile = MapEntity.tile(colony.mapCoordinates)
	Tile.update.colony(tile, null)
	Tile.removeRoad(tile)
	Util.execute(colony.destroy)
	Tile.update.harvestedBy(tile, null)

	Record.remove(colony)
}

// TODO: remove capacity entirely
const capacity = colony => 100000

const save = colony => ({
	name: colony.name,
	units: colony.units.map(unit => Record.reference(unit)),
	colonists: colony.colonists.map(colonist => Record.reference(colonist)),
	mapCoordinates: colony.mapCoordinates,
	storage: Storage.save(colony.storage),
	trade: Trade.save(colony.trade),
	buildings: colony.buildings,
	construction: Construction.save(colony.construction),
	constructionTarget: colony.constructionTarget,
	bells: colony.bells,
	crosses: colony.crosses,
	housing: colony.housing,
	growth: colony.growth,
	owner: Record.reference(colony.owner)
})

const load = colony => {
	colony.type = 'colony'

	const tile = MapEntity.tile(colony.mapCoordinates)
	tile.colony = colony
	colony.storage = Storage.load(colony.storage)
	colony.trade = Trade.load(colony.trade)
	colony.owner = Record.dereference(colony.owner)
	colony.construction = Construction.load(colony.construction)

	// legacy games load
	if (!colony.growth) {
		colony.growth = 0
	}
	if (!colony.crosses) {
		colony.crosses = 0
	}
	if (!colony.housing) {
		colony.housing = 0
	}

	colony.colonists.forEach((colonist, index) => Record.dereferenceLazy(colonist, entity => colony.colonists[index] = entity))
	colony.units.forEach((unit, index) => Record.dereferenceLazy(unit, entity => colony.units[index] = entity))
	Record.entitiesLoaded(() => initialize(colony))

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
	protection,
	save,
	load,
	area,
	coastalDirection,
	currentConstruction,
	isCoastal,
	canEmploy,
	add,
	remove,
	listen,
	listenEach,
	update,
	tories,
	rebels,
	capacity,
	disband,
	expertLevel,
	defender
}