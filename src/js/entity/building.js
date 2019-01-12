import Buildings from '../data/buildings.json'
import Goods from '../data/goods.json'

const expert = (colonist, type) => type && colonist && colonist.expert === Goods[type].expert ? 2 : 1

const efficiency = (colony, building, colonist, scale = 1) => {
	const type = Buildings[building].consumption ? Buildings[building].consumption.good || Buildings[building].consumption.type : null
	const consumption = Buildings[building].consumption

	//are there enough goods?
	return consumption ? Math.min(1, colony.storage[consumption.good] / (scale * expert(colonist, type) * consumption.amount)) : 1
}
const production = (colony, building, colonist, scale = 1) => {
	const baseProduction = Buildings[building].production
	if (!baseProduction) {
		return null
	}

	const type = baseProduction.good || baseProduction.type
	return {
		good: baseProduction.good,
		type: baseProduction.type,
		amount: scale * expert(colonist, type) * efficiency(colony, building, colonist, scale) * baseProduction.amount
	}
}

const consumption = (colony, building, colonist, scale = 1) => {
	const baseConsumption = Buildings[building].consumption
	if (!baseConsumption) {
		return null
	}

	const type = baseConsumption.good || baseConsumption.type
	return {
		good: baseConsumption.good,
		type: baseConsumption.type,
		amount: scale * expert(colonist, type) * efficiency(colony, building, colonist, scale) * baseConsumption.amount
	}

}

export default {
	production,
	consumption
}