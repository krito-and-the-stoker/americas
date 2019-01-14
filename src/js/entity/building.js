import Buildings from '../data/buildings.json'
import Goods from '../data/goods.json'
import Util from '../util/util'
import Colony from '../entity/colony'
import Unit from '../entity/unit'
import Storage from '../entity/storage'
import Message from '../view/ui/message'

const frame = (colony, name) => Buildings[name].frame[colony.buildings[name]]
const create = () => Util.makeObject(Buildings.places.map(name => [name, 0]))

const constructionOptions = colony => {
	return Object.keys(colony.buildings)
	// only when next level exists
	.filter(name => Buildings[name].name.length > colony.buildings[name] + 1)
	.map(name => ({
		target: name,
		name: Buildings[name].name[colony.buildings[name] + 1],
		cost: Buildings[name].cost[colony.buildings[name] + 1]
	})).concat([{
		target: "wagontrain",
		name: "Wagon Train",
		cost: { construction: 20 }
	}])
}

const construct = (colony, target) => {
	if (target === 'none') {
		return
	}
	const actions = {
		wagontrain: () => Unit.create('wagontrain', colony.mapCoordinates),
		warehouse: () => {
			colony.capacity += 100
			const buildings = colony.buildings
			if (buildings[target] < 2 ) {
				buildings[target] += 1
				Colony.update.buildings(colony, buildings)
			}
		}
	}
	if (actions[target]) {
		actions[target]()
	} else {
		const buildings = colony.buildings
		buildings[target] += 1
		Colony.update.buildings(colony, buildings)
	}

	Message.send(`${colony.name} has completed construction of ${colony.construction.name}.`)

	const construction = colony.construction
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
	const amount = expert(colonist, type) * (scale !== null ? scale * efficiency(colony, building, colonist, scale) : 1) * baseAmount
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
	construct
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