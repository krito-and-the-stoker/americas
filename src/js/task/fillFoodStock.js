import Util from 'util/util'

import Time from 'timeline/time'

import Storage from 'entity/storage'
import Unit from 'entity/unit'
import Tile from 'entity/tile'


const PRODUCTION_BASE_FACTOR = 1.0 / Time.PRODUCTION_BASE_TIME
const IN_COLONY_FACTOR = 10

const create = (unit, tile) => {
	const isColonistInColony = () => unit.colonist && tile.colony && unit.colonist.colony === tile.colony

	const update = (currentTime, deltaTime) => {
		const colony = Tile.supportingColony(tile)
		if (!colony) {
			return true
		}

		if (isColonistInColony()) {
			return true
		}

		if (unit.equipment.food > Unit.UNIT_FOOD_CAPACITY) {
			const pack = { good: 'food', amount: unit.equipment.food - Unit.UNIT_FOOD_CAPACITY }
			Storage.transfer(unit.equipment, colony.storage, pack)
		}

		// unscale only communicates lost food instead of all food that is moved towards another storage
		const unscale = amount => Math.min(foodCost, amount / (deltaTime * PRODUCTION_BASE_FACTOR))
		const foodCost = Unit.FOOD_COST + (unit.equipment.horses + unit.storage.horses) * Unit.FOOD_COST_PER_HORSE

		let desiredAmount
		if (unit.colony === colony) {
			// as unit in colony replenish quickly towards maximum
			desiredAmount = IN_COLONY_FACTOR * foodCost * deltaTime * PRODUCTION_BASE_FACTOR
		} else {
			// as unit in the field next to colony, replenish only what is eaten
			desiredAmount = foodCost * deltaTime * PRODUCTION_BASE_FACTOR
		}

		// in any case dont take more than the unit food capacity
		desiredAmount = Math.min(desiredAmount, Unit.UNIT_FOOD_CAPACITY - unit.equipment.food)
		const scaledAmount = Math.min(desiredAmount, colony.storage.food)
		if (colony.storage.food + colony.storage.horses > 0) {		
			// take the food you want
			let foodAmount = Util.clamp(scaledAmount, 0, colony.storage.food)

			Storage.update(unit.equipment, { good: 'food', amount: scaledAmount })
			Storage.update(colony.storage, { good: 'food', amount: -foodAmount })
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