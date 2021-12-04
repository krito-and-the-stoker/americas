import Units from 'data/units.json'

import Util from 'util/util'
import Record from 'util/record'
import Binding from 'util/binding'
import Member from 'util/member'
import PathFinder from 'util/pathFinder'
import Message from 'util/message'

import Time from 'timeline/time'

import MapEntity from 'entity/map'
import Tile from 'entity/tile'
import Storage from 'entity/storage'
import Europe from 'entity/europe'
import Colonist from 'entity/colonist'
import Owner from 'entity/owner'

import Move from 'task/move'
import PayUnits from 'task/payUnits'
import ConsumeFood from 'task/consumeFood'
import FillFoodStock from 'task/fillFoodStock'
import SupplyFromTransport from 'task/supplyFromTransport'

import Commander from 'command/commander'

import EnterColony from 'interaction/enterColony'
import LeaveColony from 'interaction/leaveColony'
import EnterEurope from 'interaction/enterEurope'

const UNIT_FOOD_CAPACITY = 20
const FOOD_COST = 2
const PASSENGER_WEIGHT = 50
const TERRAFORM_TOOLS_CONSUMPTION = 5
const PIONEER_MAX_TOOLS = 5 * TERRAFORM_TOOLS_CONSUMPTION


const RADIUS_GROWTH = 1.0 / (2* Time.WEEK)
const create = (name, coords, owner) => {
	if (Units[name]) {
		const unit = {
			name,
			owner: owner || Owner.player(),
			tile: MapEntity.tile(coords),
			properties: Units[name],
			domain: Units[name].domain,
			mapCoordinates: coords || { x: undefined, y: undefined },
			passengers: [],
			treasure: null,
			vehicle: null,
			colony: null,
			expert: null,
			offTheMap: false,
			colonist: null,
			pioneering: false,
			radius: 0,
			command: null,
			movement: {
				target: MapEntity.tile(coords)
			}
		}
		unit.storage = Storage.create()
		unit.equipment = Storage.create()
		unit.commander = Commander.create({ keep: true, unit })
		if (unit.properties.canJoin) {
			unit.colonist = Colonist.create(unit)
		}

		unit.equipment.food = unit.properties.needsFood ? UNIT_FOOD_CAPACITY : 0

		if (name === 'pioneer') {
			unit.equipment.tools = PIONEER_MAX_TOOLS
		}
		if (name === 'soldier') {
			unit.equipment.guns = 50
		}
		if (name === 'scout') {
			unit.equipment.horses = 50
		}
		if (name === 'dragoon') {
			unit.equipment.horses = 50
			unit.equipment.guns = 50
		}
		if (name === 'slave') {
			unit.expert = 'slave'
		}

		unit.destroy = initialize(unit)

		if (unit.tile && unit.tile.colony) {
			EnterColony(unit.tile.colony, unit)
		}

		Record.add('unit', unit)

		return unit
	} else {
		Message.warn('unit type not found', name)
		return null
	}
}

const goTo = (unit, target) => {
	if (!target) {
		Message.warn('goto without target is not allowed', target)
		return
	}

	// set the target to a place we can actually go to
	const path = PathFinder.findPath(unit.mapCoordinates, target.mapCoordinates, unit)
		.map(Tile.get)
		.filter(tile => !!tile)

	if (path.length > 0) {
		unit.movement = {
			target: path[path.length - 1],
			path
		}
	}
}

const isMoving = unit => unit.tile !== unit.movement.target

const initialize = unit => {
	if (unit.tile) {
		Tile.discover(unit.tile, unit.owner)
		Tile.diagonalNeighbors(unit.tile).forEach(other => Tile.discover(other, unit.owner))
	}

	return [
		Time.schedule(unit.commander),
		Time.schedule(Move.create(unit)),
		Binding.listen(unit.commander.state, 'info', info => {
			update.command(unit, info)
		}),
		Time.schedule({ update: (currentTime, deltaTime) => {
			if (unit.vehicle || (unit.colonist && unit.colonist.colony)) {
				if (unit.radius > 0) {
					update.radius(unit, 0)
				}
				return true
			}
			if (unit.radius < unit.properties.radius) {
				update.radius(unit, Math.min(unit.radius + RADIUS_GROWTH*deltaTime, unit.properties.radius))
			}

			return true
		}, priority: true }),

		listen.tile(unit, tile =>
			tile && Tile.add.unit(tile, unit)),

		Storage.listen(unit.equipment, equipment => {
			// lose status
			if (unit.name === 'pioneer' && equipment.tools < TERRAFORM_TOOLS_CONSUMPTION) {
				updateType(unit, 'settler')
			}
			if (unit.name === 'scout' && equipment.horses < 50) {
				updateType(unit, 'settler')
			}
			if (unit.name === 'dragoon' && equipment.horses < 50) {
				updateType(unit, 'soldier')
			}
			if (unit.name === 'soldier' && equipment.guns < 50) {
				updateType(unit, 'settler')
			}
			if (unit.name === 'mountedarmednative' && equipment.guns < 20) {
				updateType(unit, 'mountednative')
			}
			if (unit.name === 'mountedarmednative' && equipment.horses < 20) {
				updateType(unit, 'armednative')
			}
			if (unit.name === 'armednative' && equipment.guns < 20) {
				updateType(unit, 'native')
			}
			if (unit.name === 'mountednative' && equipment.horses < 20) {
				updateType(unit, 'native')
			}

			// gain status
			if (unit.name === 'settler') {
				if (equipment.tools >= TERRAFORM_TOOLS_CONSUMPTION) {
					updateType(unit, 'pioneer')
				}
				if (equipment.guns >= 50) {
					if (equipment.horses >= 50) {
						updateType(unit, 'dragoon')
					} else {
						updateType(unit, 'soldier')
					}
				}
				if (equipment.horses >= 50) {
					updateType(unit, 'scout')
				}
			}
			if (unit.name === 'scout') {
				if (equipment.guns >= 50) {
					updateType(unit, 'dragoon')
				}
			}
			if (unit.name === 'soldier') {
				if (equipment.horses >= 50 && equipment.guns >= 50) {
					updateType(unit, 'dragoon')
				}
			}

			if (unit.name === 'native' && equipment.horses >= 20) {
				updateType(unit, 'mountednative')
			}
			if (unit.name === 'native' && equipment.guns >= 20) {
				updateType(unit, 'armednative')
			}
			if (unit.name === 'mountednative' && equipment.guns >= 20) {
				updateType(unit, 'mountedarmednative')
			}
			if (unit.name === 'armednative' && equipment.horses >= 20) {
				updateType(unit, 'mountedarmednative')
			}
		}),

		// discover
		listen.properties(unit, properties =>
			properties.canExplore && listen.mapCoordinates(unit,
				Binding.map(coords => Tile.closest(coords), tile => {
					Tile.discover(tile, unit.owner)
					Tile.diagonalNeighbors(tile).forEach(other => Tile.discover(other, unit.owner))
				}))),

		listen.properties(unit, () => Time.schedule(PayUnits.create(unit))),
		listen.properties(unit, properties =>
			// only these units need food
			properties.needsFood &&
				// in europe nobody needs to eat
				listen.offTheMap(unit, offTheMap =>
					!offTheMap && [
						// do not eat when on a ship
						listen.vehicle(unit, vehicle =>
							!vehicle && Time.schedule(ConsumeFood.create(unit))),

						listen.mapCoordinates(unit, Binding.map(coords => Tile.closest(coords),
							tile => tile && Time.schedule(FillFoodStock.create(unit, tile))))
					]))
	]
}

const isIdle = unit => !unit.command || unit.command.id === 'idle'

const name = unit => unit.expert ? unit.properties.name[unit.expert] || unit.properties.name.default : unit.properties.name.default

const add = {
	passenger: (unit, passenger) => Member.add(unit, 'passengers', passenger),
}

const remove = {
	passenger: passenger => Member.remove(passenger.vehicle, 'passengers', passenger),
}

const computed = {
	pioneering: (unit, fn) => listen.command(unit, Binding.map(command =>
		command && ['cutForest', 'plow', 'road'].includes(command.id), fn))
}

const listen = {
	passengers: (unit, fn) => Binding.listen(unit, 'passengers', fn),
	vehicle: (unit, fn) => Binding.listen(unit, 'vehicle', fn),
	offTheMap: (unit, fn) => Binding.listen(unit, 'offTheMap', fn),
	colonist: (unit, fn) => Binding.listen(unit, 'colonist', fn),
	mapCoordinates: (unit, fn) => Binding.listen(unit, 'mapCoordinates', fn),
	colony: (unit, fn) => Binding.listen(unit, 'colony', fn),
	properties: (unit, fn) => Binding.listen(unit, 'properties', fn),
	name: (unit, fn) => Binding.listen(unit, 'name', fn),
	expert: (unit, fn) => Binding.listen(unit, 'expert', fn),
	tile: (unit, fn) => Binding.listen(unit, 'tile', fn),
	radius: (unit, fn) => Binding.listen(unit, 'radius', fn),
	command: (unit, fn) => Binding.listen(unit, 'command', fn)
}

const update = {
	vehicle: (unit, value) => Binding.update(unit, 'vehicle', value),
	offTheMap: (unit, value) => Binding.update(unit, 'offTheMap', value),
	colonist: (unit, value) => Binding.update(unit, 'colonist', value),
	mapCoordinates: (unit, value) => Binding.update(unit, 'mapCoordinates', value),
	colony: (unit, value) => Binding.update(unit, 'colony', value),
	properties: (unit, value) => Binding.update(unit, 'properties', value),
	name: (unit, value) => Binding.update(unit, 'name', value),
	expert: (unit, value) => Binding.update(unit, 'expert', value),
	tile: (unit, value) => Binding.update(unit, 'tile', value),
	radius: (unit, value) => Binding.update(unit, 'radius', value),
	command: (unit, value) => Binding.update(unit, 'command', value)
}

const updateType = (unit, name) => {
	update.name(unit, name)
	update.properties(unit, Units[name])
	update.radius(unit, 0)
}

const at = coords => Record.getAll('unit').filter(unit => unit.mapCoordinates.x === coords.x && unit.mapCoordinates.y === coords.y)
const hasCapacity = (unit, pack) => {
	const amount = pack ? pack.amount : PASSENGER_WEIGHT

	return amount <= capacity(unit)
}
const capacity = unit =>
	unit.properties.cargo - (Storage.total(unit.storage) + unit.passengers.length * PASSENGER_WEIGHT)

const area = unit => {
	let tile = unit.movement.target
	if (tile.domain === unit.domain) {
		return tile.area
	}

	tile = Tile.closest(unit.mapCoordinates)
	if (tile.domain === unit.domain) {
		return tile.area
	}

	return (Tile.radius(tile)
		.find(neighbor => neighbor.domain === unit.domain) || { area: tile.area }).area
}

const additionalEquipment = unit => Storage.goods(unit.equipment)
	.filter(pack => pack.good !== 'food')
	.filter(pack => !((unit.name === 'soldier' || unit.name === 'dragoon') && pack.good === 'guns'))
	.filter(pack => !((unit.name === 'scout' || unit.name === 'dragoon') && pack.good === 'horses'))
	.filter(pack => !(unit.name === 'pioneer' && pack.good === 'tools'))

const overWeight = unit => {
	const equipmentCapacity = 50 + unit.equipment.horses + UNIT_FOOD_CAPACITY
	return Math.max((Storage.total(unit.equipment) - equipmentCapacity) / equipmentCapacity, 0)
}

const support = unit => Util.max(Record.getAll('unit')
	.filter(support => support.properties.support)
	.filter(support => support.owner === unit.owner)
	.filter(support => support !== unit)
	.filter(support => Util.inBattleDistance(support, unit)), support => support.properties.support)

const strength = unit => {
	let result = unit.properties.combat || 0.75

	if (!unit.properties.combat && unit.colony) {
		result += Math.min(unit.colony.storage.guns / 50, 1)
	}

	const supportUnit = support(unit)
	if (supportUnit) {
		result += supportUnit.properties.support
	}

	if (unit.colony && unit.owner === unit.colony.owner) {
		result += unit.colony.buildings.fortifications.level
		if (unit.properties.colonyDefense) {
			result += unit.properties.colonyDefense
		}
	}

	result += (unit.expert === 'soldier' ? 1 : 0)
	result /= (1 + overWeight(unit))

	return result
}

const speed = unit => (unit.properties.speed +
	(unit.name === 'scout' && unit.expert === 'scout' ? 1 : 0)) / (1 + overWeight(unit))

const loadGoods = (unit, pack) => {
	const amount = Math.min(pack.amount, capacity(unit))

	Storage.update(unit.storage, { good: pack.good, amount })
	return amount
}

const loadUnit = (unit, passenger) => {
	if (!hasCapacity(unit)) {
		return false
	}

	update.vehicle(passenger, unit)
	add.passenger(unit, passenger)
	return true
}

const unloadUnit = (unit, desiredPassenger = null) => {
	if (unit.passengers.length > 0) {
		const passenger = unit.passengers.find(p => p === desiredPassenger) || unit.passengers[0]
		passenger.movement.target = unit.tile
		remove.passenger(passenger)
		update.mapCoordinates(passenger, { ...unit.mapCoordinates })
		update.tile(passenger, unit.tile)
		update.offTheMap(passenger, unit.offTheMap)
		update.vehicle(passenger, null)
		if (unit.colony) {
			EnterColony(unit.colony, passenger)
		}
		if (Europe.has.unit(unit)) {
			EnterEurope(passenger)
		}

		return passenger
	}

	Message.warn('could not unload, no units on board', unit)
	return null
}

const unloadAllUnits = unit => {
	// do not iterate over the cargo array directly because unloadUnit changes it
	Util.range(unit.passengers.length).forEach(() => unloadUnit(unit))
}

const disband = unit => {
	if (unit.colony) {
		LeaveColony(unit)
	}
	if (Europe.has.unit(unit)) {
		Europe.remove.unit(unit)
	}
	unit.passengers.forEach(disband)
	Commander.clearSchedule(unit.commander)
	if (unit.colonist) {
		Colonist.update.unit(unit.colonist, null)
	}

	unit.disbanded = true

	Util.execute(unit.destroy)
	Record.remove(unit)
}


const save = unit => ({
	name: unit.name,
	treasure: unit.treasure,
	domain: unit.domain,
	mapCoordinates: unit.mapCoordinates,
	expert: unit.expert,
	storage: Storage.save(unit.storage),
	equipment: Storage.save(unit.equipment),
	offTheMap: unit.offTheMap,
	commander: unit.commander.save(),
	colony: Record.reference(unit.colony),
	colonist: Record.reference(unit.colonist),
	passengers: unit.passengers.map(other => Record.reference(other)),
	vehicle: Record.reference(unit.vehicle),
	pioneering: unit.pioneering,
	tile: Record.referenceTile(unit.tile),
	owner: Record.reference(unit.owner),
	radius: unit.radius,
	movement: {
		target: Record.referenceTile(unit.movement.target)
	}
})

const load = unit => {
	unit.properties = Units[unit.name]
	unit.storage = Storage.load(unit.storage)
	unit.equipment = Storage.load(unit.equipment)
	unit.passengers = unit.passengers.map(Record.dereference)
	unit.owner = Record.dereference(unit.owner)
	unit.tile = Record.dereferenceTile(unit.tile)
	unit.movement = {
		target: Record.dereferenceTile(unit.movement.target)
	}
	Record.dereferenceLazy(unit.colony, colony => unit.colony = colony)
	Record.dereferenceLazy(unit.colonist, colonist => unit.colonist = colonist)
	Record.dereferenceLazy(unit.vehicle, vehicle => unit.vehicle = vehicle)
	Record.entitiesLoaded(() => {
		unit.commander = Commander.load(unit.commander)
		unit.destroy = initialize(unit)
	})

	return unit
}

export default {
	create,
	overWeight,
	speed,
	additionalEquipment,
	isIdle,
	disband,
	listen,
	isMoving,
	goTo,
	add,
	remove,
	update,
	computed,
	loadGoods,
	loadUnit,
	updateType,
	unloadUnit,
	unloadAllUnits,
	hasCapacity,
	save,
	load,
	at,
	area,
	strength,
	name,
	UNIT_FOOD_CAPACITY,
	FOOD_COST,
	TERRAFORM_TOOLS_CONSUMPTION,
	PIONEER_MAX_TOOLS,
}