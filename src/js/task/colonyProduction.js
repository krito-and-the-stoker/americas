import Buildings from 'data/buildings'

import Util from 'util/util'

import Time from 'timeline/time'

import Europe from 'entity/europe'
import Storage from 'entity/storage'
import Colony from 'entity/colony'


const PRODUCTION_BASE_FACTOR = 1.0 / Time.PRODUCTION_BASE_TIME


const PassiveBuildings = Util.makeObject(Object.entries(Buildings)
	.filter(([, building]) => building.production && building.production.passive))

const create = colony => {
	const update = (currentTime, deltaTime) => {
		const scale = deltaTime * PRODUCTION_BASE_FACTOR

		Object.keys(PassiveBuildings)
			.filter(name => colony.buildings[name])
			.forEach(name => {
				const level = colony.buildings[name].level
				const good = PassiveBuildings[name].production.good
				const amount = PassiveBuildings[name].production.passive[level]
				if (amount > 0) {
					if (good === 'bells') {
						Colony.update.bells(colony, amount * scale)
						Storage.update(colony.productionRecord, { good: 'bells', amount })
					} else if (good === 'crosses') {
						Colony.update.crosses(colony, amount * scale)
						Storage.update(colony.productionRecord, { good: 'crosses', amount })
					} else {
						Storage.update(colony.storage, { good, amount: amount * scale })
						Storage.update(colony.productionRecord, { good, amount })
					}
				}
			})

		if (colony.storage.food > 0) {
			Colony.update.growth(colony, colony.colonists.length * scale)
		}

		return true
	}


	return {
		update,
		sort: 1,
	}	
}

export default {
	create
}