import Buildings from 'data/buildings.json'
import Goods from 'data/goods.json'


const production = (colony, building, colonist) => {
	if (!Buildings[building].production) {
		return null
	}
	const level = colony.buildings[building].level
	const good = Buildings[building].production.good
	const type = ['crosses', 'bells', 'construction'].includes(good) ? good : 'good'
	let amount = Buildings[building].production.amount[level] + colony.productionBonus
	if (colonist.expert === Goods[good].expert) {
		amount *= 1.5
	}
	if (colonist.expert === 'criminal') {
		amount *= 0.333
	}
	if (colonist.expert === 'servant') {
		amount *= 0.666
	}

	amount = Math.ceil(amount)

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