import * as PIXI from 'pixi.js'

import Record from 'util/record'
import Resources from 'render/resources'
import Util from 'util/util'
import Foreground from 'render/foreground'
import Click from 'input/click'
import Message from 'view/ui/message'
import MapEntity from 'entity/map'
import Tile from 'entity/tile'

const TILE_SIZE = 64
const MAP_SETTLEMENT_FRAME_ID = 59

const create = settlement => {
	const tile = MapEntity.tile(settlement.mapCoordinates)
	const unsubscribe = Tile.listen.discovered(tile, discovered => {
		if (discovered) {
			const sprite = Resources.sprite('map', { frame: MAP_SETTLEMENT_FRAME_ID })
			sprite.x = TILE_SIZE * settlement.mapCoordinates.x
			sprite.y = TILE_SIZE * settlement.mapCoordinates.y
			Foreground.addTerrain(sprite)
			return () => {
				Foreground.removeTerrain(sprite)
			}
		}
	})

	return {
		unsubscribe,
	}
}

const destroy = view => {
	view.unsubscribe()
}

const initialize = () => {
	Record.listen('settlement', settlement => {
		const view = create(settlement)

		return () => {
			destroy(view)
		}
	})
}

export default { initialize }