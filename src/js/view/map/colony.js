import ColonyView from '../colony'
import Record from '../../util/record'
import Resources from '../../render/resources'
import Util from '../../util/util'
import Foreground from '../../render/foreground'
import Click from '../../input/click'
import Colony from '../../entity/colony'
import Text from 'src/render/text'

const TILE_SIZE = 64
const MAP_COLONY_FRAME_ID = 53 


const createSprite = colony => Resources.sprite('map', { frame: MAP_COLONY_FRAME_ID })
const create = colony => {
	const sprite = createSprite(colony)
	sprite.x = TILE_SIZE * colony.mapCoordinates.x
	sprite.y = TILE_SIZE * colony.mapCoordinates.y
	sprite.interactive = true
	Click.on(sprite, () => {
		ColonyView.open(colony)
	})
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

	const unsubscribe = Colony.listen.colonists(colony, colonists => {
		number.text = `${colonists.length}`
	})

	Foreground.addTerrain(sprite)
	Foreground.addTerrain(text)
	Foreground.addTerrain(number)

	return {
		sprite,
		text,
		number,
		unsubscribe
	}
}

const destroy = view => {
	view.unsubscribe()
	Foreground.removeTerrain(view.sprite)
	Foreground.removeTerrain(view.text)
	Foreground.removeTerrain(view.number)
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