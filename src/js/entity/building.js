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
			action: () => {
				const buildings = colony.buildings
				buildings[name] += 1
				Colony.update.buildings(colony)				
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
		}
	}

	const wagontrain = [{
		target: "wagontrain",
		name: "Wagon Train",
		cost: { construction: 39 },
		action: () => Unit.create('wagontrain', colony.mapCoordinates)
	}]

	const artillery = [{
		target: "artillery",
		name: "Artillery",
		cost: {
			construction: 192,
			tools: 40
		},
		action: () => Unit.create('artillery', colony.mapCoordinates)
	}]

	const ships = [{
		target: "caravel",
		name: "Caravel",
		cost: {
			construction: 128,
			tools: 40
		},
		action: () => Unit.create('caravel', colony.mapCoordinates)
	}, {
		target: "merchantman",
		name: "Merchantman",
		cost: {
			construction: 192,
			tools: 80
		},
		action: () => Unit.create('merchantman', colony.mapCoordinates)
	}, {
		target: "galleon",
		name: "Galleon",
		cost: {
			construction: 320,
			tools: 100
		},
		action: () => Unit.create('galleon', colony.mapCoordinates)
	}, {
		target: "privateer",
		name: "Privateer",
		cost: {
			construction: 256,
			tools: 120
		},
		action: () => Unit.create('privateer', colony.mapCoordinates)
	}, {
		target: "frigate",
		name: "Frigate",
		cost: {
			construction: 512,
			tools: 200
		},
		action: () => Unit.create('frigate', colony.mapCoordinates)
	}]

	let options = buildings.concat(wagontrain)
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
	construction.action()

	Notification.create({ type: 'construction', colony, name: construction.name })
	Message.send(`${colony.name} has completed construction of ${construction.name}.`)

	construction.amount -= construction.cost.construction
	construction.target = 'none'
	construction.cost.construction = 24
	construction.name = 'No Production'
	if (construction.cost.tools) {
		Storage.update(colony.storage, { good: 'tools', amount: -construction.cost.tools })
	}
	Colony.update.construction(colony, construction)
}

const expert = (colonist, type) => {
	if (colonist && colonist.expert === 'criminal') {
		return .33
	}

	if (colonist && colonist.expert === 'servant') {
		return .66
	}

	return type && colonist && colonist.expert === Goods[type].expert ? 2 : 1
}

const efficiency = (colony, building, colonist, scale = 1) => {
	const level = colony.buildings[building]
	const type = Buildings[building].consumption ? Buildings[building].consumption.good || Buildings[building].consumption.type : null
	const consumption = Buildings[building].consumption

	if (scale === 0) {
		return 0
	}

	//are there enough goods?
	return consumption ? Math.min(1, colony.storage[consumption.good] / (scale * expert(colonist, type) * consumption.amount[level])) : 1
}
const production = (colony, building, colonist, scale = null) => {
	const baseProduction = Buildings[building].production
	if (!baseProduction) {
		return null
	}

	if (scale === 0) {
		return {}
	}

	const level = colony.buildings[building]
	const type = baseProduction.good || baseProduction.type
	const baseAmount = Math.round(colony.productionBonus * (baseProduction.amount[level] / 3) + baseProduction.amount[level])
	const amount = expert(colonist, type) *
		(scale !== null ? scale * efficiency(colony, building, colonist, scale) : 1) *
		( type === 'bells' ? (1 + 0.5*colony.buildings.press) : 1) *
		baseAmount
	return {
		good: baseProduction.good,
		type: baseProduction.type,
		amount: scale === null ? Math.round(amount) : amount
	}
}

const consumption = (colony, building, colonist, scale = 1) => {
	const baseConsumption = Buildings[building].consumption
	if (!baseConsumption) {
		return null
	}

	const level = colony.buildings[building]
	const baseProduction = Buildings[building].production
	const type = baseProduction ? baseProduction.good || baseProduction.type : null
	const baseAmount = Math.round(colony.productionBonus * (baseConsumption.amount[level] / 3) + baseConsumption.amount[level])
	return {
		good: baseConsumption.good,
		type: baseConsumption.type,
		amount: scale * expert(colonist, type) * efficiency(colony, building, colonist, scale) * baseAmount
	}

}

export default {
	production,
	consumption,
	frame,
	create,
	constructionOptions,
	noProductionOption,
	construct,
	workspace
}


// ARMORY
// ARSENAL
// BLACKSMITH'S HOUSE
// BLACKSMITHS'S SHOP
// CARPENTER'S SHOP
// CATHEDRAL
// CHURCH
// CIGAR FACTORY
// COAT FACTORY
// COLLEGE
// CUSTOM HOUSE
// DOCKS
// DRYDOCKS
// FORT
// FORTRESS
// FUR TRADER'S HOUSE
// FUR TRADING POST 
// IRON WORKS
// LUMBER MILL
// MAGAZINE
// NEWSPAPER
// PRINTING PRESS
// RUM DISTILLER'S HOUSE
// RUM DISTILLERY
// RUM FACTORY
// SCHOOLHOUSE
// SHIPYARD
// STABLES
// STOCKADE
// TEXTILE MILL
// TOBACCONIST'S HOUSE
// TOBACCONIST'S SHOP
// TOWN HALL
// UNIVERSITY
// WAREHOUSE
// WAREHOUSE EXPANSIONS
// WEAVER'S HOUSE
// WEAVER'S SHOP