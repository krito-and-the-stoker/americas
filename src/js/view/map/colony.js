import ColonyView from 'view/colony'
import Record from 'util/record'
import Resources from 'render/resources'
import Foreground from 'render/foreground'
import Click from 'input/click'
import Colony from 'entity/colony'
import Text from 'render/text'
import Tile from 'entity/tile'
import MapEntity from 'entity/map'
import Owner from 'entity/owner'

const TILE_SIZE = 64
const MAP_COLONY_FRAME_ID = 53 


const createSprite = () => Resources.sprite('map', { frame: MAP_COLONY_FRAME_ID })
const create = colony => {
	const  unsubscribe = Tile.listen.discovered(MapEntity.tile(colony.mapCoordinates), discovered => {
		if (discovered) {		
			const sprite = createSprite(colony)
			sprite.x = TILE_SIZE * colony.mapCoordinates.x
			sprite.y = TILE_SIZE * colony.mapCoordinates.y
			sprite.interactive = true

			const unsubscribeOwner = Owner.listen.input(colony.owner, input =>
				input ? Click.on(sprite, () => {
					ColonyView.open(colony)
				}) : null)

			const text = Text.create(colony.name, {
				fontSize: 22,
			})
			text.position.x = sprite.x + TILE_SIZE / 2
			text.position.y = sprite.y + TILE_SIZE + 10
			text.anchor.set(0.5)

			const number = Text.create(colony.colonists.length, {
				fontSize: 22,
			})
			number.position.x = sprite.x + TILE_SIZE / 2
			number.position.y = sprite.y + TILE_SIZE / 2
			number.anchor.set(0.5)

			const unsubscribeSize = Colony.listen.colonists(colony, colonists => {
				number.text = `${colonists.length}`
			})

			Foreground.addTerrain(sprite)
			Foreground.addTerrain(text)
			Foreground.addTerrain(number)

			return () => {
				Foreground.removeTerrain(sprite)
				Foreground.removeTerrain(text)
				Foreground.removeTerrain(number)
				unsubscribeSize()
				unsubscribeOwner()
			}
		}	
	})

	return {
		unsubscribe
	}
}

const destroy = view => {
	view.unsubscribe()
}

const initialize = () => {
	Record.listen('colony', colony => {
		const view = create(colony)

		return () => {
			destroy(view)
		}
	})
}

export default {
	initialize,
	createSprite
}