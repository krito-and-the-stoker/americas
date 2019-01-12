import Buildings from '../data/buildings.json'
import Goods from '../data/goods.json'

const expert = (colonist, type) => {
	if (colonist && colonist.expert === 'criminal') {
		return 1
	}

	if (colonist && colonist.expert === 'servant') {
		return 2
	}

	return type && colonist && colonist.expert === Goods[type].expert ? 2 : 1
}

const efficiency = (colony, building, colonist, scale = 1) => {
	const type = Buildings[building].consumption ? Buildings[building].consumption.good || Buildings[building].consumption.type : null
	const consumption = Buildings[building].consumption

	if (scale === 0) {
		return 0
	}

	//are there enough goods?
	return consumption ? Math.min(1, colony.storage[consumption.good] / (scale * expert(colonist, type) * consumption.amount)) : 1
}
const production = (colony, building, colonist, scale = null) => {
	const baseProduction = Buildings[building].production
	if (!baseProduction) {
		return null
	}

	if (scale === 0) {
		return {}
	}

	const type = baseProduction.good || baseProduction.type
	return {
		good: baseProduction.good,
		type: baseProduction.type,
		amount: expert(colonist, type) * (scale !== null ? scale * efficiency(colony, building, colonist, scale) : 1) * baseProduction.amount
	}
}

const consumption = (colony, building, colonist, scale = 1) => {
	const baseConsumption = Buildings[building].consumption
	if (!baseConsumption) {
		return null
	}

	const baseProduction = Buildings[building].production
	const type = baseProduction ? baseProduction.good || baseProduction.type : null
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