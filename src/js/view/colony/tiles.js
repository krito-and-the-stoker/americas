import Background from '../../render/background'
import Colonist from '../../entity/colonist'
import Ressources from '../../render/ressources'
import MapEntity from '../../entity/map'
import Util from '../../util/util'
import Tile from '../../entity/tile'
import ProductionView from '../production'

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
		Background.createSpritesFromTile(tile).forEach(sprite => {
			sprite.position.x = position.x
			sprite.position.y = position.y
			container.addChild(sprite)
		})
		return {
			tile,
			position
		}
	})
	const unbindAll = colony.colonists.map(colonist => 
		Colonist.bindWorksAt(colonist, worksAt => {
			const { tile, position } = tilesAndPosition.find(({ tile }) => worksAt && worksAt.tile === tile) || {}
			if (position) {
				colonist.sprite.x = position.x
				colonist.sprite.y = position.y
				container.addChild(colonist.sprite)
			}
		})
	).reduce((all, unbind) => () => { all(); unbind(); }, () => {})
	const colonySprite = new PIXI.Sprite(new PIXI.Texture(Ressources.get().mapTiles, Util.rectangle(MAP_COLONY_FRAME_ID)))
	colonySprite.position.x = TILE_SIZE
	colonySprite.position.y = TILE_SIZE
	container.position.x = (originalDimensions.x - 450)
	container.scale.set(450 / (3 * TILE_SIZE))
	container.addChild(colonySprite)

	// production sprites for center
	const productionGoods = Tile.colonyProductionGoods(center)
	productionGoods.forEach((good, i) => {	
		const foodSprites = ProductionView.create(good, Tile.production(center, good), 32)
		foodSprites.forEach(s => {
			s.scale.set(1.0 / productionGoods.length)
			s.position.x += TILE_SIZE
			s.position.y += TILE_SIZE + i * TILE_SIZE / productionGoods.length
			container.addChild(s)
		})
	})
	// production sprites for neighbors
	Tile.diagonalNeighbors(center).filter(tile => colony.colonists.includes(tile.harvestedBy))
		.map(tile => {
			const colonist = tile.harvestedBy
			const good = colonist.worksAt.good
			const position = {
				x: TILE_SIZE * (1 + tile.mapCoordinates.x - center.mapCoordinates.x),
				y: TILE_SIZE * (1 + tile.mapCoordinates.y - center.mapCoordinates.y)
			}
			const sprites = ProductionView.create(good, Tile.production(tile, good, colonist), 32)
			sprites.forEach(s => {
				s.position.x += position.x
				s.position.y += position.y + 0.5* TILE_SIZE
				s.scale.set(0.5)
				container.addChild(s)
			})
		})

	return {
		unsubscribe: unbindAll,
		container
	}
}

export default { create }