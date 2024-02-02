import Buildings from 'data/buildings.json'
import Goods from 'data/goods.json'


const production = (colony, building, colonist) => {
	if (!Buildings[building].production) {
		return null
	}
	if (colonist.unit?.expert === 'slave') {
		return 0
	}

	const level = colony.buildings[building].level
	const good = Buildings[building].production.good
	const type = ['crosses', 'bells', 'construction'].includes(good) ? good : 'good'
	let amount = Buildings[building].production.amount[level]
	if (colonist.unit?.expert === Goods[good].expert) {
		amount *= 3
	}
	if (amount > 0) {
		amount += colony.productionBonus
	}
	if (colonist.unit?.expert === 'criminal') {
		amount -= 2
	}
	if (colonist.unit?.expert === 'servant') {
		amount -= 1
	}

	if ((amount > 0 && colonist.productionModifier > 0) || colonist.productionModifier < 0) {
		amount += colonist.productionModifier
	}

	amount = Math.ceil(amount)
	if (amount < 0) {
		amount = 0
	}

	return {
		amount,
		good,
		type
	}
}

const consumption = building => ({
	good: Buildings[building].consumption ? Buildings[building].consumption.good : null,
	factor: Buildings[building]?.consumption?.factor ?? 1,
})


export default {
	production,
	consumption
}