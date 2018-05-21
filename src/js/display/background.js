import * as PIXI from 'pixi.js'
import { loadTexture, range, rectangle } from './../util/util.js'
import Layer from './layer.js'

class Background {
	constructor(props) {
		Object.assign(this, props)
	}

	static async initialize() {
		// create layer
		const layer = new Layer({
			preserveDrawingBuffer: true,
			clearBeforeRender: false
		})

		const [undiscovered, map] = await loadTexture('images/undiscovered.jpg', 'images/map.png')

		const background = new PIXI.Sprite(undiscovered)
		const numberOfSprites = 50000
		console.log(`Creating background with ${numberOfSprites} sprites`)
		const container = new PIXI.particles.ParticleContainer();
		const tiles = range(numberOfSprites).map(index => new PIXI.Sprite(new PIXI.Texture(map, rectangle(Math.floor(150*Math.random())))))
		tiles.forEach((tile, index) => {
			tile.vx = 2*(Math.random() - .5)
			tile.vy = 2*(Math.random() - .5)
			tile.x = Math.round(layer.width / 2)
			tile.y = Math.round(layer.height / 2)
			tile.exactX = tile.x
			tile.exactY = tile.y
			container.addChild(tile)
		})

		layer.app.stage.addChild(background)
		layer.app.stage.addChild(container)

		layer.app.stop()
		layer.app.render()
		let rendering = false

		layer.app.stage.removeChild(background)
		const renderingLoop = () => {
			if (rendering) {
				tiles.forEach(tile => {
					tile.exactX += tile.vx
					tile.exactY += tile.vy
					tile.x = Math.round(tile.exactX)
					tile.y = Math.round(tile.exactY)
				})
				layer.app.render()
			}
			requestAnimationFrame(renderingLoop)
		}
		renderingLoop()

		window.addEventListener('mousedown', () => rendering = true)
		window.addEventListener('mouseup', () => rendering = false)
	}
}



export default Background
