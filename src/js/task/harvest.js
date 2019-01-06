import Tile from '../entity/tile'
import Colony from '../entity/colony'

const PRODUCTION_BASE_FACTOR = 0.0001

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
		Colony.updateStorage(colony, good, amount)

		lastUpdate = currentTime
		return true
	}

	return {
		update,
	}
}

export default { create }