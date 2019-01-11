import ColonyView from '../colony'
import Record from '../../util/record'
import Ressources from '../../render/ressources'
import Util from '../../util/util'
import Foreground from '../../render/foreground'
import Click from '../../input/click'

const TILE_SIZE = 64
const MAP_COLONY_FRAME_ID = 53 


const create = colony => {
	const sprite = new PIXI.Sprite(new PIXI.Texture(Ressources.get().mapTiles, Util.rectangle(MAP_COLONY_FRAME_ID)))
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
	Foreground.addTerrain(text)
	Foreground.addTerrain(sprite)

	return {
		sprite
	}
}

let views = []
const initialize = () => {
	Record.listen('colony', colony => {
		const view = create(colony)
		views.push(view)
	})
}

export default {
	initialize
}