import Tile from '../entity/tile'
import Storage from '../entity/storage'
import Time from '../timeline/time'

const PRODUCTION_BASE_FACTOR = 1.0 / Time.PRODUCTION_BASE_TIME

const create = (colony, tile, good, colonist = null) => {
	if (tile.harvestedBy && colonist) {
		return {
			update: () => false
		}
	}

	tile.harvestedBy = colonist || colony
	let lastUpdate = null
	const update = currentTime => {
		if (!lastUpdate) {
			lastUpdate = currentTime
			return true
		}

		const deltaTime = currentTime - lastUpdate
		const amount = deltaTime * Tile.production(tile, good, colonist) * PRODUCTION_BASE_FACTOR
		Storage.update(colony.storage, { good, amount })

		lastUpdate = currentTime
		return true
	}

	return {
		update,
	}
}

export default { create }