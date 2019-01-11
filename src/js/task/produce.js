import Buildings from '../data/buildings.json'

import Tile from '../entity/tile'
import Storage from '../entity/storage'
import Time from '../timeline/time'
import Colony from '../entity/colony'
import Europe from '../entity/europe'


const PRODUCTION_BASE_FACTOR = 1.0 / Time.PRODUCTION_BASE_TIME

const create = (colony, building, colonist) => {
	let lastUpdate = null
	const update = currentTime => {
		if (!lastUpdate) {
			lastUpdate = currentTime
			return true
		}

		const deltaTime = currentTime - lastUpdate
		const consumption = Buildings[building].consumption
		const production = Buildings[building].production
		const scale = deltaTime * PRODUCTION_BASE_FACTOR
		const efficiency = consumption ? Math.min(1, colony.storage[consumption.good] / (scale * consumption.amount)) : 1
		if (consumption) {
			Storage.update(colony.storage, { good: consumption.good, amount: -scale * efficiency * consumption.amount })
		}
		if (production && production.good) {
			Storage.update(colony.storage, { good: production.good, amount: scale * efficiency * production.amount })
		}
		if (production && production.type) {
			if (production.type === 'construction') {
				Colony.update.construction(scale * efficiency * production.amount)
			}
			if (production.type === 'bells') {
				Colony.update.bells(scale * efficiency * production.amount)
			}
			if (production.type === 'crosses') {
				Europe.update.crosses(scale * efficiency * production.amount)
			}
		}

		lastUpdate = currentTime
		return true
	}

	return {
		update,
	}
}

export default { create }