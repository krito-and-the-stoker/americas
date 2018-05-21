import * as PIXI from 'pixi.js'
import { loadTexture, range, rectangle } from './../util/util.js'
import Layer from './layer.js'

class Background {
	constructor(props) {
		Object.assign(this, props)
	}

	static async initialize(mapView) {
		// create layer
		const layer = new Layer()

		const [undiscovered, mapTiles] = await loadTexture('images/undiscovered.jpg', 'images/map.png')

		const background = new PIXI.extras.TilingSprite(undiscovered, layer.width, layer.height)
		// const numberOfSprites = 50000
		// console.log(`Creating background with ${numberOfSprites} sprites`)
		const container = new PIXI.particles.ParticleContainer(mapView.views.length);

		// const tiles = range(numberOfSprites).map(index => new PIXI.Sprite(new PIXI.Texture(map, rectangle(Math.floor(150*Math.random())))))
		// tiles.forEach((tile, index) => {
		// 	tile.vx = 2*(Math.random() - .5)
		// 	tile.vy = 2*(Math.random() - .5)
		// 	tile.x = Math.round(layer.width / 2)
		// 	tile.y = Math.round(layer.height / 2)
		// 	tile.exactX = tile.x
		// 	tile.exactY = tile.y
		// 	container.addChild(tile)
		// })
		const tiles = mapView.views.map(view => {
			return view.sprites.map(sprite => {
				const tile = new PIXI.Sprite(new PIXI.Texture(mapTiles, rectangle(sprite)))
				tile.x = view.position.x
				tile.y = view.position.y
				container.addChild(tile)
				return tile
			})
		})

		layer.app.stage.addChild(background)
		layer.app.stage.addChild(container)

		layer.app.stop()
		layer.app.render()

		return new Background({
			layer,
			container,
			background
		})
	}
}



export default Background
