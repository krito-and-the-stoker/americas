import Util from 'util/util'
import Record from 'util/record'
import MapEntity from 'entity/map'
import Settlement from 'entity/settlement'
import Message from 'view/ui/message'
import Owner from 'entity/owner'


const settlementDensity = 0.06
let tribeNames = ['Sioux', 'Apache', 'Cherokee', 'Inca', 'Aztec', 'Navajo', 'Cheyenne', 'Ponca', 'Iroquis', 'Delaware', 'Comanche']
let images = Util.range(9).map(i => `native${i+1}`)
const SPEED = 3

const createFromMap = ({ tiles }) => {
	const tribes = []
	tiles.forEach(tile => {
		if (tile.zone) {
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
	Message.log('Tribes created')
}

const create = (id, owner) => {
	const tribe = {
		id,
		owner,
	}

	tribe.name = Util.choose(tribeNames)
	tribeNames = tribeNames.filter(name => name !== tribe.name)
	tribe.image = Util.choose(images)
	images = images.filter(name => name !== tribe.image)

	Record.add('tribe', tribe)
	return tribe
}

const save = tribe => ({
	id: tribe.id,
	name: tribe.name,
	owner: Record.reference(tribe.owner)
})

const load = tribe => {
	tribe.owner = Record.dereference(tribe.owner)
	return tribe
}

export default {
	create,
	createFromMap,
	load,
	save
}