import Time from 'timeline/time'

import Storage from 'entity/storage'
import Colony from 'entity/colony'


const PRODUCTION_BASE_FACTOR = 1.0 / Time.PRODUCTION_BASE_TIME
const LOSS_FACTOR = 0.25

const create = colony => {
	const update = (currentTime, deltaTime) => {
		Object.entries(colony.storage)
			.filter(([good]) => good !== 'food')
			.filter(([, amount]) => amount > colony.capacity)
			.forEach(([good, amount]) => {
				const unscaledLoss = LOSS_FACTOR * (amount - colony.capacity)
				const loss = deltaTime * PRODUCTION_BASE_FACTOR * unscaledLoss
				Storage.update(colony.storage, { good, amount: -loss })
				Storage.update(colony.productionRecord, { good, amount: -unscaledLoss })
			})

		if (colony.construction.amount > colony.construction.cost.construction) {
			const amount = colony.construction.amount
			const capacity = colony.construction.cost.construction
			const unscaledLoss = LOSS_FACTOR * (amount - capacity)
			const loss = deltaTime * PRODUCTION_BASE_FACTOR * unscaledLoss
			colony.construction.amount -= loss
			Colony.update.construction(colony)
			Storage.update(colony.productionRecord, { good: 'construction', amount: -unscaledLoss })
		}

		return true
	}

	return {
		update,
		sort: 5
	}	
}

export default { create }