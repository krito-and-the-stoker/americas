import * as PIXI from 'pixi.js'
import { loadTexture, range, rectangle } from './../util/util.js'
import Layer from './layer.js'


class Foreground {
	constructor(props) {
		Object.assign(this, props)
	}

	static async initialize() {
		// create layer
		const layer = new Layer({
			transparent: true
		})

		// load texture
		const [map] = await loadTexture('images/map.png')

		// create 50 random textures
		const numberOfSprites = 50
		console.log(`Creating foreground with ${numberOfSprites} sprites`)
		const container = new PIXI.Container();
		const tiles = range(numberOfSprites).map(index => new PIXI.Sprite(new PIXI.Texture(map, rectangle(Math.floor(150*Math.random())))))
		tiles.forEach((tile, index) => {
			tile.x = Math.round(layer.width * Math.random())
			tile.y = Math.round(layer.height * Math.random())
			container.addChild(tile)
		})

		layer.app.stage.addChild(container)

		return new Foreground({
			container,
			layer
		})
	}
}


export default Foreground
