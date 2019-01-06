import Background from '../../render/background'
import Colonist from '../../entity/colonist'
import Ressources from '../../render/ressources'
import MapEntity from '../../entity/map'
import Util from '../../util/util'
import Tile from '../../entity/tile'
import ProductionView from '../production'
import Drag from '../../input/drag'


const TILE_SIZE = 64
const MAP_COLONY_FRAME_ID = 53 


const create = (colony, originalDimensions) => {
	const container = new PIXI.Container()
	const center = MapEntity.tile(colony.mapCoordinates)
	const tiles = [center].concat(Tile.diagonalNeighbors(center))
	const tilesAndPosition = tiles.map(tile => {
		const position = {
			x: TILE_SIZE * (1 + tile.mapCoordinates.x - center.mapCoordinates.x),
			y: TILE_SIZE * (1 + tile.mapCoordinates.y - center.mapCoordinates.y)
		}
		const sprites = Background.createSpritesFromTile(tile)
		sprites.forEach(sprite => {
			sprite.position.x = position.x
			sprite.position.y = position.y
			container.addChild(sprite)
		})
		const destroy = Drag.makeDragTarget(sprites[sprites.length - 1], entity => {
			if (Colonist.is(entity)) {
				if (!tile.harvestedBy) {
					Colonist.beginFieldWork(colony, tile, entity.worksAt ? entity.worksAt.good : 'food', entity)
					return true
				}
			}
			return false
		})
		return {
			tile,
			position,
			destroy
		}
	})
	const unbindTiles = tilesAndPosition.reduce((all, tp) => () => { all(); tp.destroy(); }, () => {})
	const unbindColonists = colony.colonists.map(colonist => {
		let sprites = []
		return Colonist.bindWorksAt(colonist, worksAt => {
			const { tile, position } = tilesAndPosition.find(({ tile }) => worksAt && worksAt.tile === tile) || {}
			sprites.forEach(s => container.removeChild(s))
			if (position) {
				colonist.sprite.x = position.x
				colonist.sprite.y = position.y
				container.addChild(colonist.sprite)

				const good = colonist.worksAt.good
				sprites = ProductionView.create(good, Tile.production(tile, good, colonist), TILE_SIZE / 2)
				sprites.forEach(s => {
					s.position.x += position.x
					s.position.y += position.y + 0.5 * TILE_SIZE
					s.scale.set(0.5)
					container.addChild(s)
				})
			}
		})
	}).reduce((all, unbind) => () => { all(); unbind(); }, () => {})
	const colonySprite = new PIXI.Sprite(new PIXI.Texture(Ressources.get().mapTiles, Util.rectangle(MAP_COLONY_FRAME_ID)))
	colonySprite.position.x = TILE_SIZE
	colonySprite.position.y = TILE_SIZE
	container.position.x = (originalDimensions.x - 450)
	container.scale.set(450 / (3 * TILE_SIZE))
	container.addChild(colonySprite)

	// production sprites for center
	const productionGoods = Tile.colonyProductionGoods(center)
	productionGoods.forEach((good, i) => {	
		const foodSprites = ProductionView.create(good, Tile.production(center, good), TILE_SIZE / 2)
		foodSprites.forEach(s => {
			s.scale.set(1.0 / productionGoods.length)
			s.position.x += TILE_SIZE
			s.position.y += TILE_SIZE + i * TILE_SIZE / productionGoods.length
			container.addChild(s)
		})
	})


	const unsubscribe = () => {
		unbindTiles()
		unbindColonists()
	}

	return {
		unsubscribe,
		container
	}
}

export default { create }