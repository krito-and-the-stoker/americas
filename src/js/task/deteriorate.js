import Storage from '../entity/storage'
import Colony from '../entity/colony'
import Time from '../timeline/time'
import Task from '../util/task'

const PRODUCTION_BASE_FACTOR = 1.0 / Time.PRODUCTION_BASE_TIME
const LOSS_FACTOR = 0.25

const create = colony => {
	let lastUpdate = null
	const update = currentTime => {
		if (!lastUpdate) {
			lastUpdate = currentTime
			return true
		}

		const deltaTime = currentTime - lastUpdate
		Object.entries(colony.storage)
			.filter(([good, amount]) => good !== 'food')
			.filter(([good, amount]) => amount > colony.capacity)
			.forEach(([good, amount]) => {
				const loss = deltaTime * PRODUCTION_BASE_FACTOR * LOSS_FACTOR * (amount - colony.capacity)
				Storage.update(colony.storage, { good, amount: -loss })
				Storage.update(colony.productionRecord, { good, amount: -loss })
			})

		if (colony.construction.amount > colony.construction.cost.construction) {
			const amount = colony.construction.amount
			const capacity = colony.construction.cost.construction
			const loss = deltaTime * PRODUCTION_BASE_FACTOR * LOSS_FACTOR * (amount - capacity)
			Colony.update.construction(colony, {
				...colony.construction,
				amount: colony.construction.amount - loss
			})
			Storage.update(colony.productionRecord, { good: 'construction', amount: -loss })
		}

		lastUpdate = currentTime
		return true
	}

	return {
		update: Task.batch(update)
	}	
}

export default { create }