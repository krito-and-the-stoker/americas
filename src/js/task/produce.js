import Buildings from '../data/buildings.json'

import Tile from '../entity/tile'
import Colony from '../entity/colony'
import Time from '../timeline/time'


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
			Colony.updateStorage(colony, consumption.good, - scale * efficiency * consumption.amount)
		}
		if (production) {
			Colony.updateStorage(colony, production.good, scale * efficiency * production.amount)
		}

		lastUpdate = currentTime
		return true
	}

	return {
		update,
	}
}

export default { create }