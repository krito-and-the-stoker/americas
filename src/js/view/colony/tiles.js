import * as PIXI from 'pixi.js'

import Drag from 'input/drag'

import Colonist from 'entity/colonist'
import MapEntity from 'entity/map'
import Tile from 'entity/tile'
import Colony from 'entity/colony'

import BecomeColonist from 'interaction/becomeColonist'
import JoinColony from 'interaction/joinColony'
import UnjoinColony from 'interaction/unjoinColony'

import Commander from 'command/commander'

import Background from 'render/background'
import Resources from 'render/resources'

import ProductionView from 'view/production'

import ColonistView from 'view/colony/colonist'

import Context from 'view/ui/context'


const TILE_SIZE = 64
const MAP_COLONY_FRAME_ID = 53 


const create = (colony, originalDimensions) => {
	const container = new PIXI.Container()
	const center = MapEntity.tile(colony.mapCoordinates)
	const tiles = [center].concat(Tile.diagonalNeighbors(center))
	const tilesAndPositions = tiles.map(tile => {
		const position = {
			x: TILE_SIZE * (1 + tile.mapCoordinates.x - center.mapCoordinates.x),
			y: TILE_SIZE * (1 + tile.mapCoordinates.y - center.mapCoordinates.y)
		}

		return {
			tile,
			position
		}
	})
	const unsubscribeTiles = tiles.map(tile => {
		return Tile.listen.tile(tile, tile => {
			const sprites = Background.createSpritesFromTile(tile)
			const { position } = tilesAndPositions.find(tp => tp.tile === tile)
			sprites.forEach(sprite => {
				sprite.position.x = position.x
				sprite.position.y = position.y
				container.addChild(sprite)
			})
			
			const unsubscribeDragTarget = Drag.makeDragTarget(sprites[sprites.length - 1], async (args, coords) => {
				const { unit } = args
				if (unit && !Commander.isIdle(unit.commander)) {
					return false
				}
				if (!colony.buildings.harbour.level && tile.domain === 'sea') {
					return false
				}
				if (colony.disbanded) {
					return false
				}
				if (!tile.harvestedBy) {
					if (!unit && !args.colonist) {
						return false
					}

					let colonist = args.colonist
					if (unit) {
						if (unit.colonist) {
							JoinColony(colony, unit.colonist)
						} else {
							BecomeColonist(colony, unit)
						}
						colonist = unit.colonist
					}
					if (colonist) {					
						const options = Tile.fieldProductionOptions(tile, colonist)
						if (options.length === 0) {
							if (!colonist.colony) {
								UnjoinColony(colonist)
							}
							return false
						}
						if (options.length === 1 || unit) {
							Colonist.beginFieldWork(colonist, tile, options[0].good)
						} else {
							coords.y += 0.5 * TILE_SIZE / 2 - 7

							const optionsView = options.map(Context.productionOption)
							const decision = await Context.create(optionsView, coords, 64, 0.5)
							Colonist.beginFieldWork(colonist, tile, decision.good)
						}
						return true
					}
				}
				return false
			})
			return () => {
				unsubscribeDragTarget()
				sprites.forEach(s => container.removeChild(s))
			}
		})
	})

	const createColonistView = (productionBonus, colonist, work) => {
		const { tile, position } = tilesAndPositions.find(({ tile }) => work && work.tile === tile) || {}
		
		if (position) {
			return Tile.listen.tile(tile, tile => {
				const colonistSprite = ColonistView.create(colonist)
				colonistSprite.x = position.x
				colonistSprite.y = position.y
				colonistSprite.scale.set(0.75)
				container.addChild(colonistSprite)

				const good = work.good
				const productionSprites = ProductionView.create(good, Tile.production(tile, good, colonist), TILE_SIZE / 2)
				productionSprites.forEach(s => {
					s.position.x += position.x
					s.position.y += position.y + 0.5 * TILE_SIZE
					s.scale.set(0.5)
					container.addChild(s)
				})

				return () => {
					container.removeChild(colonistSprite)
					productionSprites.forEach(s => container.removeChild(s))
				}
			})
		}		
	}

	const unsubscribeColonists = Colony.listen.productionBonus(colony, productionBonus => 
		Colony.listen.colonists(colony, colonists => 
			colonists.map(colonist => 
				Colonist.listen.work(colonist, work =>
					Colonist.listen.expert(colonist, () => createColonistView(productionBonus, colonist, work))))))

	
	const unsubscribeCenter = Tile.listen.tile(center, center => {	
		const colonySprite = Resources.sprite('map', { frame: MAP_COLONY_FRAME_ID })
		colonySprite.position.x = TILE_SIZE
		colonySprite.position.y = TILE_SIZE
		container.position.x = (originalDimensions.x - 450)
		container.scale.set(450 / (3 * TILE_SIZE))
		container.addChild(colonySprite)

		// production sprites for center
		const productionGoods = Tile.colonyProductionGoods(center)
		const productionSprites = productionGoods.map((good, i) => {	
			const sprites = ProductionView.create(good, Tile.production(center, good), TILE_SIZE / 2)
			sprites.forEach(s => {
				s.scale.set(1.0 / productionGoods.length)
				s.position.x += TILE_SIZE
				s.position.y += TILE_SIZE + i * TILE_SIZE / productionGoods.length
				container.addChild(s)
			})
			return sprites
		}).flat()

		return () => {
			container.removeChild(colonySprite)
			container.removeChild(productionSprites)
		}
	})


	const unsubscribe = [
		unsubscribeTiles,
		unsubscribeColonists,
		unsubscribeCenter,
	]

	return {
		unsubscribe,
		container
	}
}

export default { create }