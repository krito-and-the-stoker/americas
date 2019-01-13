import * as PIXI from 'pixi.js'

import Record from '../../util/record'
import Ressources from '../../render/ressources'
import Util from '../../util/util'
import Foreground from '../../render/foreground'
import Click from '../../input/click'
import Message from '../../view/ui/message'
import MapEntity from '../../entity/map'
import Tile from '../../entity/tile'

const TILE_SIZE = 64
const MAP_SETTLEMENT_FRAME_ID = 59

const create = settlement => {
	const sprite = new PIXI.Sprite(new PIXI.Texture(Ressources.get().mapTiles, Util.rectangle(MAP_SETTLEMENT_FRAME_ID)))
	sprite.x = TILE_SIZE * settlement.mapCoordinates.x
	sprite.y = TILE_SIZE * settlement.mapCoordinates.y

	Click.on(sprite, () => {
		Message.send(`This is a settlement of the ${settlement.tribe.name}. (${settlement.mapCoordinates.x}, ${settlement.mapCoordinates.y})`)
	})

	const tile = MapEntity.tile(settlement.mapCoordinates)
	Tile.listen(tile, tile => {
		if (tile.discovered) {
			Foreground.addTerrain(sprite)
		}

		return () => {
			Foreground.removeTerrain(sprite)
		}
	})

	return {
		sprite,
	}
}

const initialize = () => {
	Record.listen('settlement', settlement => {
		const view = create(settlement)
	})
}

export default { initialize }