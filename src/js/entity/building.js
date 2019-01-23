import Buildings from '../data/buildings.json'
import Goods from '../data/goods.json'
import Util from '../util/util'
import Colony from '../entity/colony'
import Unit from '../entity/unit'
import Storage from '../entity/storage'
import Message from '../view/ui/message'
import Notification from '../view/ui/notification'

const frame = (colony, name) => Buildings[name].frame[colony.buildings[name]]
const create = () => Util.makeObject(Buildings.places.map(name => [name, 0]))

const workspace = (colony, building) => Buildings[building].workspace.length ? Buildings[building].workspace[colony.buildings[building]] : Buildings[building].workspace || 0

const constructionOptions = colony => {
	const buildings = Buildings.places
		.filter(name => Buildings[name].name.length > colony.buildings[name] + 1)
		.map(name => ({
			target: name,
			name: Buildings[name].name[colony.buildings[name] + 1],
			cost: Buildings[name].cost[colony.buildings[name] + 1],
			population: Buildings[name].population[colony.buildings[name] + 1],
			action: () => {
				const buildings = colony.buildings
				buildings[name] += 1
				Colony.update.buildings(colony)
				Notification.create({ type: 'construction', colony, building: name })
			}
		}))

	buildings.find(b => b.target === 'warehouse').action = () => {
		colony.capacity += 100
		if (colony.buildings.warehouse < 2) {
			const buildings = colony.buildings
			if (!buildings.warehouse) {
				buildings.warehouse = 0
			}
			buildings.warehouse += 1
			Colony.update.buildings(colony)
			Notification.create({ type: 'construction', colony, building: 'warehouse' })
		}
	}

	const wagontrain = [{
		target: "wagontrain",
		name: "Wagon Train",
		cost: { construction: 40 },
		action: () => {
			const unit = Unit.create('wagontrain', colony.mapCoordinates)
			Notification.create({ type: 'construction', colony, unit })
		}
	}]

	const artillery = [{
		target: "artillery",
		name: "Artillery",
		cost: {
			construction: 192,
			tools: 40
		},
		action: () => {
			const unit = Unit.create('artillery', colony.mapCoordinates)
			Notification.create({ type: 'construction', colony, unit })
		}
	}]

	const ships = [{
		target: "caravel",
		name: "Caravel",
		cost: {
			construction: 128,
			tools: 40
		},
		action: () => {
			const unit = Unit.create('caravel', colony.mapCoordinates)
			Notification.create({ type: 'construction', colony, unit })
		}
	}, {
		target: "merchantman",
		name: "Merchantman",
		cost: {
			construction: 192,
			tools: 80
		},
		action: () => {
			const unit = Unit.create('merchantman', colony.mapCoordinates)
			Notification.create({ type: 'construction', colony, unit })
		}
	}, {
		target: "galleon",
		name: "Galleon",
		cost: {
			construction: 320,
			tools: 100
		},
		action: () => {
			const unit = Unit.create('galleon', colony.mapCoordinates)
			Notification.create({ type: 'construction', colony, unit })
		}
	}, {
		target: "privateer",
		name: "Privateer",
		cost: {
			construction: 256,
			tools: 120
		},
		action: () => {
			const unit = Unit.create('privateer', colony.mapCoordinates)
			Notification.create({ type: 'construction', colony, unit })
		}
	}, {
		target: "frigate",
		name: "Frigate",
		cost: {
			construction: 512,
			tools: 200
		},
		action: () => {
			const unit = Unit.create('frigate', colony.mapCoordinates)
			Notification.create({ type: 'construction', colony, unit })
		}
	}]

	let options = buildings
		.filter(building => building.population <= colony.colonists.length)
		.concat(wagontrain)
	if (colony.buildings.gunsmiths) {
		options = options.concat(artillery)
	}
	if (colony.buildings.harbour >= 3) {
		options = options.concat(ships)
	}

	return options
}

const noProductionOption = () => ({
	target: 'none',
	cost: {
		construction: 24
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
			construction: 24,
			tools: 0
		},
		amount: construction.amount
	}

	Colony.update.construction(colony, newConstruction)
}



export default {
	frame,
	create,
	constructionOptions,
	noProductionOption,
	construct,
	workspace
}
