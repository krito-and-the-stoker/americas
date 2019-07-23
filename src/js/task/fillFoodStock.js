import Time from 'timeline/time'

import Storage from 'entity/storage'
import Unit from 'entity/unit'


const PRODUCTION_BASE_FACTOR = 1.0 / Time.PRODUCTION_BASE_TIME
const FOOD_COST = 2

const create = (unit, colony) => {
	const update = (currentTime, deltaTime) => {
		if (unit.colonist && unit.colonist.colony === colony) {
			// when in colony just balance the storage towards 0
			const scaledAmount = Math.min(-unit.equipment.food, colony.storage.food + colony.storage.horses)
			const unscaledAmount = scaledAmount / (deltaTime * PRODUCTION_BASE_FACTOR)

			Storage.update(unit.equipment, { good: 'food', amount: scaledAmount })
			Storage.update(colony.storage, { good: 'food', amount: -scaledAmount })
			Storage.update(colony.productionRecord, { good: 'food', amount: -unscaledAmount })
		} else {
			// we are in range of a colony and want to equip us with food from there
			// always take twice the amount needed until local storage is full
			const desiredAmount = Math.min(2 * FOOD_COST * deltaTime * PRODUCTION_BASE_FACTOR, Unit.UNIT_FOOD_CAPACITY - unit.equipment.food)
			const scaledAmount = Math.min(desiredAmount, colony.storage.food + colony.storage.horses)
			const unscaledAmount = scaledAmount / (deltaTime * PRODUCTION_BASE_FACTOR)

			Storage.update(unit.equipment, { good: 'food', amount: scaledAmount })
			Storage.update(colony.storage, { good: 'food', amount: -scaledAmount })
			Storage.update(colony.productionRecord, { good: 'food', amount: -unscaledAmount })
		}
		
		return true
	}

	return {
		update,
		sort: 3
	} 
}

export default { create }