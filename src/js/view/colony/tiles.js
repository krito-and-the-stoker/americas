import * as PIXI from 'pixi.js'

import Util from 'util/util'

import Drag from 'input/drag'
import Click from 'input/click'

import Colonist from 'entity/colonist'
import MapEntity from 'entity/map'
import Tile from 'entity/tile'

import BecomeColonist from 'interaction/becomeColonist'
import JoinColony from 'interaction/joinColony'
import UnjoinColony from 'interaction/unjoinColony'

import Commander from 'command/commander'

import Background from 'render/background'
import Resources from 'render/resources'

import ProductionView from 'view/production'

import ColonistView from 'view/colony/colonist'

import Icon from 'view/ui/icon'
import Context from 'view/ui/context'


const TILE_SIZE = 64
const MAP_COLONY_FRAME_ID = 53 


const create = (colony, originalDimensions) => {
	const container = {
		tiles: new PIXI.Container(),
		colonists: new PIXI.Container()
	}
	const center = MapEntity.tile(colony.mapCoordinates)
	const tiles = Tile.radius(center)
	const relativePosition = tile => ({
		x: TILE_SIZE * (1 + tile.mapCoordinates.x - center.mapCoordinates.x),
		y: TILE_SIZE * (1 + tile.mapCoordinates.y - center.mapCoordinates.y)
	})

	const unsubscribeTiles = tiles.map(tile => {
		return Tile.listen.tile(tile, tile => {
			const sprites = Background.createSpritesFromTile(tile)
			const position = relativePosition(tile)
			sprites.forEach(sprite => {
				sprite.position.x = position.x
				sprite.position.y = position.y
				container.tiles.addChild(sprite)
			})

			const destroySprites = () => {
				sprites.forEach(s => container.tiles.removeChild(s))
			}

			const destroyHarvester = Tile.listen.harvestedBy(tile, harvester => {
				if (harvester) {
					if (harvester.type === 'colonist') {
						const colonist = harvester

						const sprite = ColonistView.create(colonist)
						sprite.x = position.x
						sprite.y = position.y
						sprite.scale.set(0.75)
						container.colonists.addChild(sprite)

						const destroySprite = () => {
							container.colonists.removeChild(sprite)
						}

						if (colonist.colony === colony) {
							const good = colonist.work.good
							const productionSprites = ProductionView.create(good, Tile.production(tile, good, colonist), TILE_SIZE / 2)
							productionSprites.forEach(s => {
								s.position.x += position.x
								s.position.y += position.y + 0.5 * TILE_SIZE
								s.scale.set(0.5)
								container.colonists.addChild(s)
							})

							const destroyProductionSprites = () => {
								productionSprites.forEach(s => {
									container.colonists.removeChild(s)
								})
							}

							return [
								Click.on(sprite, async () => {
									if (colonist.work && colonist.work.type === 'Field') {
										const tile = colonist.work.tile
										const options = Tile.fieldProductionOptions(tile, colonist)
										if (options.length > 1) {			
											const coords = sprite.getGlobalPosition()
											const scale = Util.globalScale(sprite)
											coords.y += 0.5 * sprite.height / 2 - 7

											const optionsView = options.map(Context.productionOption)
											sprite.visible = false
											const decision = await Context.create(optionsView, coords, 64, 0.5 * scale)
											sprite.visible = true
											Colonist.beginFieldWork(colonist, tile, decision.good)
										}
									}
								}),

								Drag.makeDraggable(sprite, { colonist }),
								destroySprite,
								destroyProductionSprites
							]
						} else {
							const greyScaleFilter = new PIXI.filters.ColorMatrixFilter()
							greyScaleFilter.blackAndWhite()
							sprite.filters = [greyScaleFilter]
							return destroySprite
						}
					}

					if (harvester.type === 'settlement') {
						const icon = Icon.create('natives')
						icon.x = position.x + 16
						icon.y = position.y + 16
						icon.scale.set(0.5)
						container.colonists.addChild(icon)
						return () => { container.colonists.removeChild(icon) }
					}
				}
			})			

			const destroyDrag = Drag.makeDragTarget(sprites[sprites.length - 1], async (args, coords) => {
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

			return [
				destroySprites,
				destroyDrag,
				destroyHarvester
			]
		})
	})

	
	const unsubscribeCenter = Tile.listen.tile(center, center => {	
		const colonySprite = Resources.sprite('map', { frame: MAP_COLONY_FRAME_ID })
		colonySprite.position.x = TILE_SIZE
		colonySprite.position.y = TILE_SIZE
		container.tiles.addChild(colonySprite)

		// production sprites for center
		const productionGoods = Tile.colonyProductionGoods(center)
		const productionSprites = productionGoods.map((good, i) => {	
			const sprites = ProductionView.create(good, Tile.production(center, good), TILE_SIZE / 2)
			sprites.forEach(s => {
				s.scale.set(1.0 / productionGoods.length)
				s.position.x += TILE_SIZE
				s.position.y += TILE_SIZE + i * TILE_SIZE / productionGoods.length
				container.tiles.addChild(s)
			})
			return sprites
		}).flat()

		return () => {
			container.tiles.removeChild(colonySprite)
			container.tiles.removeChild(productionSprites)
		}
	})

	container.tiles.position.x = (originalDimensions.x - 450)
	container.tiles.scale.set(450 / (3 * TILE_SIZE))
	container.colonists.position.x = (originalDimensions.x - 450)
	container.colonists.scale.set(450 / (3 * TILE_SIZE))


	const unsubscribe = [
		unsubscribeTiles,
		unsubscribeCenter,
	]

	return {
		unsubscribe,
		container
	}
}

export default { create }