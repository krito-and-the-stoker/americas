import Buildings from 'data/buildings.json'
import Goods from 'data/goods.json'


const production = (colony, building, colonist) => {
	if (!Buildings[building].production) {
		return null
	}
	const level = colony.buildings[building]
	const good = Buildings[building].production.good
	const type = ['crosses', 'bells', 'construction'].includes(good) ? good : 'good'
	let amount = Buildings[building].production.amount[level] + colony.productionBonus
	if (colonist.expert === Goods[good].expert) {
		amount *= 2
	}
	if (colonist.expert === 'criminal') {
		amount *= 0.333
	}
	if (colonist.expert === 'servant') {
		amount *= 0.666
	}
	if (good === 'bells' && colony.buildings.press === 1) {
		amount *= 1.5
	}
	if (good === 'bells' && colony.buildings.press === 2) {
		amount *= 2
	}

	return {
		amount,
		good,
		type
	}
}

const consumption = building => ({
	good: Buildings[building].consumption ? Buildings[building].consumption.good : null
})


export default {
	production,
	consumption
}