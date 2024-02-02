import Terrain from 'data/terrain'

import Util from 'util/util'
import Member from 'util/member'
import Binding from 'util/binding'
import Record from 'util/record'
import Message from 'util/message'

import MapEntity from 'entity/map'
import Settlement from 'entity/settlement'
import Owner from 'entity/owner'
import Storage from 'entity/storage'

import Natives from 'ai/natives'


const settlementDensity = 0.06
let tribeNames = ['Sioux', 'Apache', 'Cherokee', 'Inca', 'Aztec', 'Navajo', 'Cheyenne', 'Ponca', 'Iroquis', 'Delaware', 'Comanche']
let images = Util.range(9).map(i => `native${i+1}`)
const SPEED = 3

const createFromMap = ({ tiles }) => {
	const tribes = []
	tiles.forEach(tile => {
		if (tile.zone && tile.zone !== Terrain.start.id) {
			if (!tribes.map(tribe => tribe.id).includes(tile.zone)) {
				tribes.push(create(tile.zone, Owner.create('natives')))
			}
		}
	})

	const zone = tiles.filter(tile => tile.zone).filter(tile => !tile.rumors).filter(tile => tile.domain === 'land')
	let possibleLocations = Util.removeDuplicates(Util.range(Math.round(settlementDensity * zone.length))
		.map(() => Util.choose(zone).mapCoordinates))

	Util.range(20).forEach(() => {
		possibleLocations = possibleLocations.map(location => {
			const direction = possibleLocations.filter(other => other !== location)
				.reduce((current, other) => {
					const force = {
						x: location.x - other.x,
						y: location.y - other.y
					}
					const lengthSquared = force.x * force.x + force.y * force.y
					const length = Math.sqrt(lengthSquared)
					return lengthSquared ? {						
						x: current.x + force.x / (lengthSquared * length),
						y: current.y + force.y / (lengthSquared * length)
					} : current
				}, { x: 0, y: 0 })

			return Util.range(10).map(i => ({
				x: location.x + Math.round(SPEED * direction.x / (10 - i)),
				y: location.y + Math.round(SPEED * direction.y / (10 - i))
			})).reduce((currentLocation, possibleNewLocation) => {
				return zone.includes(MapEntity.tile(possibleNewLocation)) ? possibleNewLocation : currentLocation
			}, location)
		})
	})

	possibleLocations.forEach(coords => {
		const tribe = tribes.find(tribe => tribe.id === MapEntity.tile(coords).zone)
		Settlement.create(tribe, coords, tribe.owner)
	})
	Message.log(`Tribes created (${tribes.length})`)
}

const create = (id, owner) => {
	const tribe = {
		id,
		owner,
		civilizationLevel: 1 + 9 * Math.random(),
		settlements: [],
		storage: Storage.create()
	}

	tribe.name = Util.choose(tribeNames)
	tribeNames = tribeNames.filter(name => name !== tribe.name)
	tribe.image = Util.choose(images)
	images = images.filter(name => name !== tribe.image)

	Natives.update.tribe(owner.ai, tribe)

	Record.add('tribe', tribe)
	return tribe
}

const add = {
	settlement: (tribe, settlement) => Member.add(tribe, 'settlements', settlement)
}

const listen = {
	settlements: (tribe, fn) => Binding.listen(tribe, 'settlements', fn)
}


const save = tribe => ({
	id: tribe.id,
	name: tribe.name,
	image: tribe.image,
	civilizationLevel: tribe.civilizationLevel,
	settlements: tribe.settlements.map(Record.reference),
	owner: Record.reference(tribe.owner),
	storage: Storage.save(tribe.storage)
})

const load = tribe => {
	tribe.owner = Record.dereference(tribe.owner)
	tribe.storage = Storage.load(tribe.storage)
	Record.entitiesLoaded(() => {
		tribe.settlements = tribe.settlements.map(Record.dereference)
	})

	return tribe
}

export default {
	create,
	createFromMap,
	add,
	listen,
	load,
	save
}