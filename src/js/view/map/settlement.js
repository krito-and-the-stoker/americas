import Goods from 'data/goods'

import Util from 'util/util'
import Record from 'util/record'

import Click from 'input/click'

import MapEntity from 'entity/map'
import Tile from 'entity/tile'
import Settlement from 'entity/settlement'

import Resources from 'render/resources'
import Foreground from 'render/foreground'


const TILE_SIZE = 64

const create = settlement => {
	const tile = MapEntity.tile(settlement.mapCoordinates)
	const unsubscribe = Tile.listen.discovered(tile, discovered => {
		if (discovered) {
			const sprite = Resources.sprite('map', { frame: settlement.tribe.id - 1 })
			sprite.x = TILE_SIZE * settlement.mapCoordinates.x
			sprite.y = TILE_SIZE * settlement.mapCoordinates.y

			Click.on(sprite, () => console.log(settlement.owner.ai.state.relations))
			Foreground.addTerrain(sprite)

			const unsubscribeMission = Settlement.listen.mission(settlement, mission => {
				if (mission) {
					const missionSymbol = Resources.sprite('map', { frame: Goods.crosses.id })
					missionSymbol.x = sprite.x + 16
					missionSymbol.y = sprite.y + 16
					missionSymbol.scale.set(0.5)
					Foreground.addTerrain(missionSymbol)

					return () => Foreground.removeTerrain(missionSymbol)
				}
			})

			return [
				() => Foreground.removeTerrain(sprite),
				unsubscribeMission
			]
		}
	})

	return {
		unsubscribe,
	}
}

const destroy = view => {
	Util.execute(view.unsubscribe)
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