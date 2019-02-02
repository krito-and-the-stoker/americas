import ColonyFrames from 'data/colony'

import Util from 'util/util'
import Record from 'util/record'

import Colony from 'entity/colony'
import Tile from 'entity/tile'
import MapEntity from 'entity/map'
import Owner from 'entity/owner'

import Click from 'input/click'

import Resources from 'render/resources'
import Foreground from 'render/foreground'
import Text from 'render/text'

import ColonyView from 'view/colony'

const TILE_SIZE = 64

const frame = colony => ColonyFrames.colony[Object.keys(ColonyFrames.colony)
	.filter(frame => frame !== 'default')
	.map(frame => Number(frame))
	.reduce((selected, frame) => colony.colonists.length >= frame ? frame : selected, 0)]

const createSprite = colony => Resources.sprite('map', { frame: frame(colony) })
const create = colony => {
	const view = {}
	view.unsubscribe = Tile.listen.discovered(MapEntity.tile(colony.mapCoordinates), discovered => {
		if (discovered) {		
			view.sprite = createSprite(colony)
			view.sprite.x = TILE_SIZE * colony.mapCoordinates.x
			view.sprite.y = TILE_SIZE * colony.mapCoordinates.y
			view.sprite.interactive = true

			const unsubscribeOwner = Owner.listen.input(colony.owner, input =>
				input ? Click.on(view.sprite, () => {
					ColonyView.open(colony)
				}) : null)

			view.text = Text.create(colony.name, {
				fontSize: 22,
			})
			view.text.position.x = view.sprite.x + TILE_SIZE / 2
			view.text.position.y = view.sprite.y + TILE_SIZE + 10
			view.text.anchor.set(0.5)

			view.number = Text.create(colony.colonists.length, {
				fontSize: 22,
			})
			view.number.position.x = view.sprite.x + TILE_SIZE / 2
			view.number.position.y = view.sprite.y + TILE_SIZE / 2
			view.number.anchor.set(0.5)

			const unsubscribeSize = Colony.listen.colonists(colony, colonists => {
				view.number.text = `${colonists.length}`
			})

			const unsubscribeBuildings = Colony.listen.buildings(colony, buildings => {
				if (view.fortifications) {
					view.fortifications.texture = Resources.texture('map', { frame: ColonyFrames.fortifications[buildings.fortifications.level] })
				} else {
					view.fortifications = Resources.sprite('map', { frame: ColonyFrames.fortifications[buildings.fortifications.level] })
				}
			})
			view.fortifications.x = view.sprite.x
			view.fortifications.y = view.sprite.y

			Foreground.addTerrain(view.sprite)
			Foreground.addTerrain(view.fortifications)
			Foreground.addTerrain(view.text)
			Foreground.addTerrain(view.number)

			return () => {
				Foreground.removeTerrain(view.sprite)
				Foreground.removeTerrain(view.fortifications)
				Foreground.removeTerrain(view.text)
				Foreground.removeTerrain(view.number)
				unsubscribeSize()
				unsubscribeOwner()
				unsubscribeBuildings()
			}
		}	
	})

	return view
}

const initialize = () => {
	Record.listen('colony', colony => {
		const view = create(colony)

		const destroy = () => view.unsubscribe()
		return Util.mergeFunctions([
			destroy,
			Colony.listen.colonists(colony, () => {
				if (view.sprite) {
					view.sprite.texture = Resources.texture('map', { frame: frame(colony) })
				}
			})
		])
	})
}

export default {
	initialize,
	createSprite
}