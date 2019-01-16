import ColonyView from '../colony'
import Record from '../../util/record'
import Ressources from '../../render/ressources'
import Util from '../../util/util'
import Foreground from '../../render/foreground'
import Click from '../../input/click'
import Colony from '../../entity/colony'

const TILE_SIZE = 64
const MAP_COLONY_FRAME_ID = 53 


const createSprite = colony => new PIXI.Sprite(new PIXI.Texture(Ressources.get().mapTiles, Util.rectangle(MAP_COLONY_FRAME_ID)))
const create = colony => {
	const sprite = createSprite(colony)
	sprite.x = TILE_SIZE * colony.mapCoordinates.x
	sprite.y = TILE_SIZE * colony.mapCoordinates.y
	sprite.interactive = true
	Click.on(sprite, () => {
		ColonyView.open(colony)
	})
	const text = new PIXI.Text(colony.name, {
		fontFamily: 'Times New Roman',
		fontSize: 22,
		fill: 0xffffff,
		align: 'center'
	})
	text.position.x = sprite.x + TILE_SIZE / 2
	text.position.y = sprite.y + TILE_SIZE + 10
	text.anchor.set(0.5)

	const number = new PIXI.Text(`${colony.colonists.length}`, {
		fontFamily: 'Times New Roman',
		fontSize: 22,
		fill: 0xffffff,
		align: 'center'
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