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

		const [undiscovered, mapTilesTexture] = await loadTexture('images/undiscovered.jpg', 'images/map.png')

		const background = new PIXI.extras.TilingSprite(undiscovered, layer.width, layer.height)
		// const numberOfSprites = 50000
		// console.log(`Creating background with ${numberOfSprites} sprites`)
		const container = new PIXI.particles.ParticleContainer(10000);
		// const container = new PIXI.Container();

		console.log('creating tiles')
		const tiles = mapView.views.map(view => ({
			spites: null,
			view,
			createSprites: () => view.sprites.map(sprite => {
				const tile = new PIXI.Sprite(new PIXI.Texture(mapTilesTexture, rectangle(Math.abs(sprite) - 1)))
				tile.x = view.position.x
				tile.y = view.position.y
				tile.blendMode = sprite > 0 ? PIXI.BLEND_MODES.NORMAL : PIXI.BLEND_MODES.OVERLAY
				return tile
			})
		}))


		layer.app.stage.addChild(background)
		layer.app.stage.addChild(container)

		layer.app.stop()

		const result = new Background({
			layer,
			container,
			background,
			tiles,
			mapTilesTexture,
			numTiles: mapView.numTiles
		})

		console.log('first render')
		result.render()
		return result
	}

	render() {
		this.container.removeChildren()
		const tileWidth = Math.ceil(this.layer.width / 64) + 1
		const tileHeight = Math.ceil(this.layer.height / 64) + 1
		const tileX = -Math.ceil(this.container.x / 64)
		const tileY = -Math.ceil(this.container.y / 64)
		range(tileWidth).forEach(deltaX => {
			range(tileHeight).forEach(deltaY => {
				const x = tileX + deltaX
				const y = tileY + deltaY
				const index = y * this.numTiles.x + x
				if (index >= 0 && index < this.tiles.length) {				
					if (!this.tiles[index].sprites) {
						this.tiles[index].sprites = this.tiles[index].createSprites()
					}
					this.tiles[index].sprites.forEach(sprite => this.container.addChild(sprite))
				}
			})
		})
		this.layer.app.render()
	}
}



export default Background
