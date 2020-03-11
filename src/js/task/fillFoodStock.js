import Util from 'util/util'

import Time from 'timeline/time'

import Storage from 'entity/storage'
import Unit from 'entity/unit'


const PRODUCTION_BASE_FACTOR = 1.0 / Time.PRODUCTION_BASE_TIME

const create = (unit, colony) => {
	const inColony = () => unit.colonist && unit.colonist.colony === colony

	const update = (currentTime, deltaTime) => {
		if (unit.equipment.food > Unit.UNIT_FOOD_CAPACITY) {
			const pack = { good: 'food', amount: unit.equipment.food - Unit.UNIT_FOOD_CAPACITY }
			console.log(pack)
			Storage.transfer(unit.equipment, colony.storage, pack)
		}

		const unscale = amount => amount / (deltaTime * PRODUCTION_BASE_FACTOR)
		// when in colony just balance the storage towards 0
		const desiredAmount = inColony() ? -unit.equipment.food :
			// when we are in range of a colony and want to equip us with food from there
			// always take twice the amount needed until local storage is full
			Math.min(2 * Unit.FOOD_COST * deltaTime * PRODUCTION_BASE_FACTOR, Unit.UNIT_FOOD_CAPACITY - unit.equipment.food)

		const scaledAmount = Math.min(desiredAmount, colony.storage.food + Unit.FOOD_GAIN_PER_HORSE * colony.storage.horses)
		if (colony.storage.food + colony.storage.horses > 0) {		
			// take the food you want
			let foodAmount = Util.clamp(scaledAmount, 0, colony.storage.food)
			// use horses for the rest
			let horsesAmount = Util.clamp(scaledAmount - foodAmount, 0, Unit.FOOD_GAIN_PER_HORSE * colony.storage.horses)
			// if needed take more food
			foodAmount = Util.clamp(scaledAmount - horsesAmount, 0, colony.storage.food)

			Storage.update(unit.equipment, { good: 'food', amount: scaledAmount })
			Storage.update(colony.storage, { good: 'horses', amount: -horsesAmount })
			Storage.update(colony.storage, { good: 'food', amount: -foodAmount })
			Storage.update(colony.productionRecord, { good: 'horses', amount: -unscale(horsesAmount) })
			Storage.update(colony.productionRecord, { good: 'food', amount: -unscale(foodAmount) })
		}
		
		return true
	}

	return {
		update,
		sort: 3
	} 
}

export default { create }