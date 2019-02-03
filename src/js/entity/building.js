import Buildings from 'data/buildings.json'

import Util from 'util/util'
import Message from 'util/message'
import Events from 'util/events'

import Colony from 'entity/colony'
import Unit from 'entity/unit'
import Storage from 'entity/storage'


const create = () => {
	const positions = Util.range(11).map(x =>
		Util.range(5).map(y => ({
			x,
			y,
			width: (x >= 4 && x <= 6) ? 2 : 1,
			taken: false,
		})))
		.flat()
		.filter(({ x, y}) =>
			x >= 3 &&
			y >= 1 &&
			x <= 8 &&
			y <= 3 &&
			(x >= 4 || y === 2) &&
			(x <= 7 || y >= 2))


	const buildings = Buildings.places.map(name => ({
		name,
		level: 0,
		width: Buildings[name].width
	}))
	if (buildings.filter(building => building.width === 2).length < 2 * buildings.filter(building => building.width === 2)) {
		console.warn('There might not be enough slots for double width buildings left', buildings, positions)
	}
	buildings.filter(building => building.width === 2).forEach(building => {
		building.position = Util.choose(positions.filter(pos => !pos.taken && pos.width >= 2))
		// TODO: This is super buggy and will sometimes not work and lead to bugs. just plz plz refactor it!
		if (building.position) {		
			building.position.taken = true
			const left = positions.find(pos => pos.x === building.position.x - 1 && pos.y === building.position.y)
			if (left) {
				left.width = 1
			}
			const right = positions.find(pos => pos.x === building.position.x + 1 && pos.y === building.position.y)
			if (right) {
				right.taken = true
			}
		}
	})
	if (buildings.filter(building => building.width === 1).length > positions.filter(pos => !pos.taken).length) {
		console.warn('There is not enough slots left for buildings with size 1', buildings, positions)
	}
	buildings.filter(building => building.width === 1).forEach(building => {
		building.position = Util.choose(positions.filter(pos => !pos.taken))
		building.position.taken = true
	})

	return Util.makeObject(buildings.map(building => [building.name, building]))
}

const getName = (colony, building) => Buildings[building.name].name[building.level]
const workspace = (colony, building) => Buildings[building].workspace.length ? Buildings[building].workspace[colony.buildings[building].level] : Buildings[building].workspace || 0

const constructionOptions = colony => {
	const buildings = Buildings.places
		.filter(name => Buildings[name].name.length > colony.buildings[name].level + 1)
		.map(name => ({
			target: name,
			name: Buildings[name].name[colony.buildings[name].level + 1],
			cost: Buildings[name].cost[colony.buildings[name].level + 1],
			population: Buildings[name].population[colony.buildings[name].level + 1],
			action: () => {
				const buildings = colony.buildings
				buildings[name].level += 1
				Colony.update.buildings(colony)
				Events.trigger('notification', { type: 'construction', colony, building: colony.buildings[name] })
			}
		}))

	buildings.find(b => b.target === 'warehouse').action = () => {
		colony.capacity += 100
		if (colony.buildings.warehouse.level < 2) {
			const buildings = colony.buildings
			if (!buildings.warehouse.level) {
				buildings.warehouse.level = 0
			}
			buildings.warehouse.level += 1
			Colony.update.buildings(colony)
			Events.trigger('notification', { type: 'construction', colony, building: colony.buildings['warehouse'] })
		}
	}

	const wagontrain = [{
		target: 'wagontrain',
		name: 'Wagon Train',
		cost: { construction: 40 },
		action: () => {
			const unit = Unit.create('wagontrain', colony.mapCoordinates, colony.owner)
			Events.trigger('notification', { type: 'construction', colony, unit })
		}
	}]

	const artillery = [{
		target: 'artillery',
		name: 'Artillery',
		cost: {
			construction: 400,
			tools: 80
		},
		action: () => {
			const unit = Unit.create('artillery', colony.mapCoordinates, colony.owner)
			Events.trigger('notification', { type: 'construction', colony, unit })
		}
	}]

	const ships = [{
		target: 'caravel',
		name: 'Caravel',
		cost: {
			construction: 250,
			tools: 80
		},
		action: () => {
			const unit = Unit.create('caravel', colony.mapCoordinates, colony.owner)
			Events.trigger('notification', { type: 'construction', colony, unit })
		}
	}, {
		target: 'merchantman',
		name: 'Merchantman',
		cost: {
			construction: 400,
			tools: 160
		},
		action: () => {
			const unit = Unit.create('merchantman', colony.mapCoordinates, colony.owner)
			Events.trigger('notification', { type: 'construction', colony, unit })
		}
	}, {
		target: 'galleon',
		name: 'Galleon',
		cost: {
			construction: 640,
			tools: 200
		},
		action: () => {
			const unit = Unit.create('galleon', colony.mapCoordinates, colony.owner)
			Events.trigger('notification', { type: 'construction', colony, unit })
		}
	}, {
		target: 'privateer',
		name: 'Privateer',
		cost: {
			construction: 500,
			tools: 240
		},
		action: () => {
			const unit = Unit.create('privateer', colony.mapCoordinates, colony.owner)
			Events.trigger('notification', { type: 'construction', colony, unit })
		}
	}, {
		target: 'frigate',
		name: 'Frigate',
		cost: {
			construction: 1000,
			tools: 400
		},
		action: () => {
			const unit = Unit.create('frigate', colony.mapCoordinates, colony.owner)
			Events.trigger('notification', { type: 'construction', colony, unit })
		}
	}]

	let options = buildings
		.filter(building => building.population <= colony.colonists.length)
		.concat(wagontrain)
	if (colony.buildings.gunsmiths.level) {
		options = options.concat(artillery)
	}
	if (colony.buildings.harbour.level >= 3) {
		options = options.concat(ships)
	}

	return options
}

const noProductionOption = () => ({
	target: 'none',
	cost: {
		construction: 50
	},
	name: 'No Production'
})

const construct = (colony, construction) => {
	if (construction.target === 'none') {
		return
	}

	Message.send(`${colony.name} has completed construction of ${construction.name}.`)
	construction.action()


	construction.amount -= construction.cost.construction
	if (construction.cost.tools) {
		Storage.update(colony.storage, { good: 'tools', amount: -construction.cost.tools })
	}

	const newConstruction = {
		target: 'none',
		action: () => {},
		name: `${construction.name} completed`,
		cost: {
			construction: 50,
			tools: 0
		},
		amount: construction.amount
	}

	Colony.update.construction(colony, newConstruction)
}



export default {
	getName,
	create,
	constructionOptions,
	noProductionOption,
	construct,
	workspace
}
