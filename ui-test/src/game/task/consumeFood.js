import Time from 'timeline/time'

import Events from 'util/events'

import Storage from 'entity/storage'
import Unit from 'entity/unit'


const PRODUCTION_BASE_FACTOR = 1.0 / Time.PRODUCTION_BASE_TIME
const CHANCE_OF_DEATH = 0.01

const create = unit => {
	const isColonistInColony = () => unit.colonist && unit.colonist.colony

	const update = (currentTime, deltaTime) => {
		if (isColonistInColony()) {
			return true
		}

		if (unit.name === 'scout' && !Unit.isMoving(unit)) {
			return true
		}

		if (unit.equipment.food < -0.1) {
			if (Math.random() < CHANCE_OF_DEATH) {
				Unit.disband(unit)
				Events.trigger('notification', { type: 'died', unit })
			}
			return true
		}

		const unscaledAmount = Unit.FOOD_COST
		const scaledAmount = deltaTime * PRODUCTION_BASE_FACTOR * unscaledAmount

		Storage.update(unit.equipment, { good: 'food', amount: -scaledAmount })

		return true
	}

	return {
		update,
		sort: 3
	} 
}

export default { create }