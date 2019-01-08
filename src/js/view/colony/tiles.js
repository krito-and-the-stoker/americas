import Background from '../../render/background'
import Colonist from '../../entity/colonist'
import Ressources from '../../render/ressources'
import MapEntity from '../../entity/map'
import Util from '../../util/util'
import Tile from '../../entity/tile'
import ProductionView from '../production'
import Drag from '../../input/drag'
import Context from '../../view/context'
import Colony from '../../entity/colony'


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
		const destroy = Drag.makeDragTarget(sprites[sprites.length - 1], async args => {
			const { unit } = args
			if (!tile.harvestedBy) {
				if (!unit && !args.colonist) {
					return false
				}
				let colonist = args.colonist || Colonist.create(colony, unit)
				const options = Tile.fieldProductionOptions(tile, colonist)
				if (options.length === 1) {
					Colonist.beginFieldWork(colonist, tile, options[0].good)
				} else {
					const coords = colonist.sprite.getGlobalPosition()
					const scale = Util.globalScale(colonist.sprite)
					coords.y += 0.5 * colonist.sprite.height / 2

					const optionsView = options.map(Context.productionOption)
					const decision = await Context.create(optionsView, coords, 80, 0.5 * scale)
					Colonist.beginFieldWork(colonist, tile, decision.good)
				}
				return true
			}
			return false
		})
		return {
			tile,
			position,
			destroy
		}
	})
	const unsubscribeTiles = tilesAndPosition.reduce((all, tp) => () => { all(); tp.destroy(); }, () => {})
	const unsubscribeColonists = Colony.bindColonists(colony, colonists => {
		const colonistsSprites = []
		
		const cleanupWorksAt = Util.mergeFunctions(colonists.map(colonist => {
			return Colonist.bindWorksAt(colonist, worksAt => {
				const { tile, position } = tilesAndPosition.find(({ tile }) => worksAt && worksAt.tile === tile) || {}
				
				if (position) {
					colonist.sprite.x = position.x
					colonist.sprite.y = position.y
					container.addChild(colonist.sprite)
					colonistsSprites.push(colonist.sprite)

					const good = colonist.worksAt.good
					const productionSprites = ProductionView.create(good, Tile.production(tile, good, colonist), TILE_SIZE / 2)
					productionSprites.forEach(s => {
						s.position.x += position.x
						s.position.y += position.y + 0.5 * TILE_SIZE
						s.scale.set(0.5)
						container.addChild(s)
					})

					return () => {
						console.log('cleaning up production sprites', position)
						productionSprites.forEach(s => container.removeChild(s))
					}
				}
			})
		}))

		return () => {
			console.log('cleaning up worksAt and colony sprites')
			colonistsSprites.forEach(s => container.removeChild(s))
			cleanupWorksAt()
		}
	})
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
		unsubscribeTiles()
		unsubscribeColonists()
	}

	return {
		unsubscribe,
		container
	}
}

export default { create }