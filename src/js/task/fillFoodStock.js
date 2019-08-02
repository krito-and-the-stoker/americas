import Util from 'util/util'

import Time from 'timeline/time'

import Storage from 'entity/storage'
import Unit from 'entity/unit'


const PRODUCTION_BASE_FACTOR = 1.0 / Time.PRODUCTION_BASE_TIME


const create = (unit, colony) => {
	const inColony = () => unit.colonist && unit.colonist.colony === colony

	const update = (currentTime, deltaTime) => {
		const unscale = amount => amount / (deltaTime * PRODUCTION_BASE_FACTOR)
		// when in colony just balance the storage towards 0
		const desiredAmount = inColony() ? -unit.equipment.food :
			// when we are in range of a colony and want to equip us with food from there
			// always take twice the amount needed until local storage is full
			Math.min(2 * Unit.FOOD_COST * deltaTime * PRODUCTION_BASE_FACTOR, Unit.UNIT_FOOD_CAPACITY - unit.equipment.food)

		const scaledAmount = Math.min(desiredAmount, colony.storage.food + colony.storage.horses)
		const averageTargetAmount = (colony.storage.food + colony.storage.horses - scaledAmount) / 2
		const horsesAmount = Util.clamp(colony.storage.horses - averageTargetAmount, 0, scaledAmount)
		const foodAmount = Util.clamp(colony.storage.food - averageTargetAmount, 0, scaledAmount)

		Storage.update(unit.equipment, { good: 'food', amount: scaledAmount })
		Storage.update(colony.storage, { good: 'horses', amount: -horsesAmount })
		Storage.update(colony.storage, { good: 'food', amount: -foodAmount })
		Storage.update(colony.productionRecord, { good: 'horses', amount: -unscale(horsesAmount) })
		Storage.update(colony.productionRecord, { good: 'food', amount: -unscale(foodAmount) })
		
		return true
	}

	return {
		update,
		sort: 3
	} 
}

export default { create }