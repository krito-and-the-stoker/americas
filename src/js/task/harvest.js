import Tile from 'entity/tile'
import Storage from 'entity/storage'
import Time from 'timeline/time'
import Colony from 'entity/colony'
import Colonist from 'entity/colonist'

const PRODUCTION_BASE_FACTOR = 1.0 / Time.PRODUCTION_BASE_TIME

const create = (colony, tile, good, colonist = null) => {
	if (tile.harvestedBy && colonist) {
		return {
			update: () => false
		}
	}

	let production = 0
	const calculate = () => Tile.listen.tile(tile, () => 
		Colony.listen.productionBonus(colony, () => {
			production = Tile.production(tile, good, colonist) * PRODUCTION_BASE_FACTOR
		}))

	const unsubscribe = colonist ? Colonist.listen.expert(colonist, calculate) : calculate()

	tile.harvestedBy = colonist || colony
	let lastUpdate = null
	const update = currentTime => {
		if (!lastUpdate) {
			lastUpdate = currentTime
			return true
		}

		const deltaTime = currentTime - lastUpdate
		const amount = deltaTime * production
		Storage.update(colony.storage, { good, amount })
		Storage.update(colony.productionRecord, { good, amount })

		lastUpdate = currentTime
		return true
	}

	const finished = () => unsubscribe()

	return {
		update,
		finished
	}
}

export default { create }