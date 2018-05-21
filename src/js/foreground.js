import * as PIXI from 'pixi.js'
import { loadTexture, range, rectangle } from './util.js'

class Foreground {
	static async initialize() {
		//Create a Pixi Application
		const [width, height] = [window.innerWidth, window.innerHeight]
		const app = new PIXI.Application({
			transparent: true
		})
		app.renderer.view.style.position = "absolute";
		app.renderer.view.style.display = "block";
		app.renderer.autoResize = true;
		app.renderer.resize(window.innerWidth, window.innerHeight)

		//Add the canvas that Pixi automatically created for you to the HTML document
		document.body.appendChild(app.view)

		const [map] = await loadTexture('images/map.png')
		const numberOfSprites = 50
		console.log(`Benchmarking foreground with ${numberOfSprites} sprites`)
		const container = new PIXI.particles.ParticleContainer();
		app.stage.addChild(container)
		const tiles = range(numberOfSprites).map(index => new PIXI.Sprite(new PIXI.Texture(map, rectangle(Math.floor(150*Math.random())))))
		tiles.forEach((tile, index) => {
			tile.vx = 2*(Math.random() - .5)
			tile.vy = 2*(Math.random() - .5)
			tile.x = Math.round(width * Math.random())
			tile.y = Math.round(height * Math.random())
			tile.exactX = tile.x
			tile.exactY = tile.y
			container.addChild(tile)
		})

		
		app.ticker.add(() => {
			tiles.forEach(tile => {
				// tile.exactX += tile.vx
				// tile.exactY += tile.vy
				// tile.x = Math.round(tile.exactX)
				// tile.y = Math.round(tile.exactY)
			})
		})
	}
}


export default Foreground
