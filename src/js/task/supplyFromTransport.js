import Time from 'timeline/time'

import Storage from 'entity/storage'
import Unit from 'entity/unit'


const PRODUCTION_BASE_FACTOR = 1.0 / Time.PRODUCTION_BASE_TIME
const FOOD_COST = 2

const create = (transport, unit) => {
	const update = (currentTime, deltaTime) => {
		// always take twice the amount needed until local storage is full
		const desiredAmount = Math.min(2 * FOOD_COST * deltaTime * PRODUCTION_BASE_FACTOR, Unit.UNIT_FOOD_CAPACITY - unit.equipment.food)
		const scaledAmount = Math.min(desiredAmount, transport.storage.food + transport.storage.horses)

		Storage.update(unit.equipment, { good: 'food', amount: scaledAmount })
		Storage.update(transport.storage, { good: 'food', amount: -scaledAmount })
		
		return true
	}

	return {
		update,
		sort: 3
	} 
}

export default { create }