import Units from 'data/units.json'

import Util from 'util/util'
import Record from 'util/record'
import Binding from 'util/binding'
import Member from 'util/member'

import Time from 'timeline/time'

import MapEntity from 'entity/map'
import Tile from 'entity/tile'
import Storage from 'entity/storage'
import Europe from 'entity/europe'
import Colonist from 'entity/colonist'
import Owner from 'entity/owner'

import Commander from 'command/commander'

import EnterColony from 'interaction/enterColony'
import LeaveColony from 'interaction/leaveColony'
import EnterEurope from 'interaction/enterEurope'


const RADIUS_GROWTH = 1.0 / 2500
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
		}
		unit.storage = Storage.create()
		unit.equipment = Storage.create()
		unit.commander = Commander.create({ keep: true, unit })

		if (name === 'pioneer') {
			unit.equipment.tools = 100
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

		unit.destroy = initialize(unit)

		if (unit.tile && unit.tile.colony) {
			EnterColony(unit.tile.colony, unit)
		}

		Record.add('unit', unit)

		return unit
	} else {
		console.warn('unit type not found', name)
		return null
	}
}

const initialize = unit => {
	if (unit.tile) {
		Tile.discover(unit.tile, unit.owner)
		Tile.diagonalNeighbors(unit.tile).forEach(other => Tile.discover(other, unit.owner))
	}

	[
		Time.schedule(unit.commander),
		Time.schedule({ update: (currentTime, deltaTime) => {
			if (unit.vehicle) {
				if (unit.radius > 0) {
					update.radius(unit, 0)
				}
				return true
			}
			if (unit.domain !== unit.tile.domain) {
				update.radius(unit, 0)
				return true
			}
			if (unit.radius < unit.properties.radius) {
				update.radius(unit, Math.min(unit.radius + RADIUS_GROWTH*deltaTime, unit.properties.radius))
			}

			return true
		}, priority: true }),

		listen.tile(unit, tile =>
			Tile.add.unit(tile, unit)),

		Storage.listen(unit.equipment, equipment => {
			// lose status
			if (unit.name === 'pioneer' && equipment.tools < 20) {
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

			// gain status
			if (unit.name === 'settler') {
				if (equipment.tools >= 20) {
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
		}),

		listen.colonist(unit, colonist => colonist ? Colonist.listen.expert(colonist, expert => update.expert(unit, expert)) : null)
	]
}

const name = unit => unit.expert ? unit.properties.name[unit.expert] || unit.properties.name.default : unit.properties.name.default

const add = {
	passenger: (unit, passenger) => Member.add(unit, 'passengers', passenger),
}

const remove = {
	passenger: passenger => Member.remove(passenger.vehicle, 'passengers', passenger),
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
	pioneering: (unit, fn) => Binding.listen(unit, 'pioneering', fn),
	tile: (unit, fn) => Binding.listen(unit, 'tile', fn),
	radius: (unit, fn) => Binding.listen(unit, 'radius', fn),
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
	pioneering: (unit, value) => Binding.update(unit, 'pioneering', value),
	tile: (unit, value) => Binding.update(unit, 'tile', value),
	radius: (unit, value) => Binding.update(unit, 'radius', value),
}

const updateType = (unit, name) => {
	update.name(unit, name)
	update.properties(unit, Units[name])
	update.radius(unit, 0)
}

const at = coords => Record.getAll('unit').filter(unit => unit.mapCoordinates.x === coords.x && unit.mapCoordinates.y === coords.y)
const hasCapacity = (unit, pack) => {
	if (!pack) {
		return Storage.split(unit.storage).length + unit.passengers.length < unit.properties.cargo
	}
	const testStorage = Storage.copy(unit.storage)
	Storage.update(testStorage, pack)

	return Storage.split(testStorage).length + unit.passengers.length <= unit.properties.cargo
}

const area = unit => {
	const tile = unit.tile
	if (tile.domain === unit.domain) {
		return tile.area
	}
	return Tile.radius(tile)
		.find(neighbor => neighbor.domain === unit.domain).area
}

const strength = unit => unit.properties.combat || 1

const loadGoods = (unit, pack) => {
	if (!hasCapacity(unit, pack) && pack.amount > 0) {
		return false
	}

	Storage.update(unit.storage, pack)
	return true
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
	console.warn('could not unload, no units on board', unit)
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

	Util.execute(unit.destroy)
	Record.remove(unit)
}


const save = unit => ({
	name: unit.name,
	properties: unit.properties,
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
})

const load = unit => {
	unit.storage = Storage.load(unit.storage)
	unit.equipment = Storage.load(unit.equipment)
	unit.passengers = unit.passengers.map(Record.dereference)
	unit.owner = Record.dereference(unit.owner)
	unit.tile = Record.dereferenceTile(unit.tile)
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
	disband,
	listen,
	add,
	remove,
	update,
	loadGoods,
	loadUnit,
	unloadUnit,
	unloadAllUnits,
	hasCapacity,
	save,
	load,
	at,
	area,
	strength,
	name
}