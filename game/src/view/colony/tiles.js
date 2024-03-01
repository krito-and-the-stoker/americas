import * as PIXI from 'pixi.js'

import Goods from 'data/goods'

import Util from 'util/util'

import Drag from 'input/drag'
import Click from 'input/click'
import Hover from 'input/hover'

import Colonist from 'entity/colonist'
import Colony from 'entity/colony'
import Unit from 'entity/unit'
import MapEntity from 'entity/map'
import Tile from 'entity/tile'
import Treasure from 'entity/treasure'

import JoinColony from 'interaction/joinColony'
import UnjoinColony from 'interaction/unjoinColony'

import Background from 'render/background'
import Resources from 'render/resources'

import ProductionView from 'view/production'

import ColonistView from 'view/colony/colonist'

import Icon from 'view/ui/icon'
import Context from 'view/ui/context'
import Dialog from 'view/ui/dialog'

const TILE_SIZE = 64
const MAP_COLONY_FRAME_ID = 53

const buyLandDialog = (tile, colony, settlement) =>
  Dialog.open('colony.buyland', {
    settlement,
    disableBuy: Treasure.amount() < 500,
    buy: () => {
      settlement.owner.ai.state.relations[colony.owner.referenceId].trust -= 0.025
      Treasure.spend(500)
      Tile.update.harvestedBy(tile, null)
    },
    claim: () => {
      settlement.owner.ai.state.relations[colony.owner.referenceId].trust -= 0.2
      settlement.owner.ai.state.relations[colony.owner.referenceId].militancy += 0.1
      Tile.update.harvestedBy(tile, null)
    }
  })


const create = (colony, originalDimensions) => {
  const container = {
    tiles: new PIXI.Container(),
    colonists: new PIXI.Container(),
  }
  const center = MapEntity.tile(colony.mapCoordinates)
  const tiles = Tile.radius(center).concat([center])
  const relativePosition = tile => ({
    x: TILE_SIZE * (1 + tile.mapCoordinates.x - center.mapCoordinates.x),
    y: TILE_SIZE * (1 + tile.mapCoordinates.y - center.mapCoordinates.y),
  })

  const drawColonist = (position, tile, colonist) => {
    const drawProductionSprites = colonistSprite => {
      const good = colonist.work.good
      const productionSprites = ProductionView.create(
        good,
        Tile.production(tile, good, colonist),
        TILE_SIZE / 2
      )
      productionSprites.forEach(s => {
        s.position.x += position.x
        s.position.y += position.y + 0.5 * TILE_SIZE
        s.scale.set(0.5)
        container.colonists.addChild(s)
      })

      return [
        () => {
          productionSprites.forEach(s => {
            container.colonists.removeChild(s)
          })
        },

        productionSprites.map(sprite =>
          Click.on(
            sprite,
            async () => {
              if (colonist.work && colonist.work.type === 'Field') {
                const tile = colonist.work.tile
                const options = Tile.fieldProductionOptions(tile, colonist)
                if (options.length > 1) {
                  const coords = colonistSprite.getGlobalPosition()
                  const scale = Util.globalScale(colonistSprite)
                  coords.y += (0.5 * colonistSprite.height) / 2 - 7

                  const optionsView = options.map(Context.productionOption)
                  colonistSprite.visible = false
                  productionSprites.forEach(s => {
                    s.visible = false
                  })
                  const decision = await Context.create(optionsView, coords, 64, 0.5 * scale)
                  colonistSprite.visible = true
                  productionSprites.forEach(s => {
                    s.visible = true
                  })
                  Colonist.beginFieldWork(colonist, tile, decision.good)
                }
              }
            },
            'Select goods for production'
          )
        ),
      ]
    }

    const drawEducation = () => {
      return Colonist.listen.beingEducated(colonist, beingEducated => {
        if (beingEducated) {
          const bookSprite = Resources.sprite('map', {
            frame: Goods.books.id,
          })
          bookSprite.scale.set(0.5)
          bookSprite.x = position.x + 0.25 * TILE_SIZE
          bookSprite.y = position.y
          container.colonists.addChild(bookSprite)
          return () => {
            container.colonists.removeChild(bookSprite)
          }
        }
      })
    }

    const greyOutColonist = sprite => {
      const greyScaleFilter = new PIXI.filters.ColorMatrixFilter()
      greyScaleFilter.blackAndWhite()
      sprite.filters = [greyScaleFilter]
    }

    return Unit.listen.expert(colonist.unit, () => {
      const sprite = ColonistView.create(colonist)
      sprite.x = position.x
      sprite.y = position.y
      sprite.scale.set(0.75)
      container.colonists.addChild(sprite)
      const destroySprite = () => {
        container.colonists.removeChild(sprite)
      }

      if (colonist.colony === colony) {
        return [
          Colonist.listen.state(colonist, () => {
            sprite.tint = ColonistView.tint(colonist)
          }),
          Colonist.listen.state(colonist, () =>
            Colony.listen.productionBonus(colony, () =>
              Colony.listen.newBuildings(colony, () => drawProductionSprites(sprite))
            )
          ),
          drawEducation(),
          Click.on(
            sprite,
            () => ColonistView.createDetailView(colonist),
            'View colonist details'
          ),
          Hover.track(
            sprite,
            { type: 'colonist', colonist }
          ),
          Drag.makeDraggable(
            sprite,
            { colonist },
            'Move to other field or building to change production'
          ),
          destroySprite,
        ]
      } else {
        greyOutColonist(sprite)
        return destroySprite
      }

      return destroySprite
    })
  }

  const drawSettlement = (position, tile, harvester) => {
    if (tile.settlement) {
      const sprite = Resources.sprite('map', {
        frame: tile.settlement.tribe.id - 1,
      })
      sprite.x = position.x
      sprite.y = position.y
      container.colonists.addChild(sprite)
      return () => {
        container.colonists.removeChild(sprite)
      }
    } else {
      const icon = Icon.create('natives')
      icon.x = position.x + 16
      icon.y = position.y + 16
      icon.scale.set(0.5)
      container.colonists.addChild(icon)
      return [
        () => container.colonists.removeChild(icon),
        Click.on(icon, () => buyLandDialog(tile, colony, harvester), 'Buy land'),
      ]
    }
  }

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

      const destroyHarvester = Tile.listen.harvestedBy(
        tile,
        harvester =>
          harvester &&
          (harvester.type === 'colonist'
            ? drawColonist(position, tile, harvester)
            : harvester.type === 'settlement'
              ? drawSettlement(position, tile, harvester)
              : null)
      )

      const destroyDrag = Drag.makeDragTarget(
        sprites,
        ({ unit, colonist }) => {
          if (colony.disbanded) {
            return
          }

          if (tile.harvestedBy) {
            return
          }

          if (unit && unit.properties.canJoin) {
            return `Join Colony and start working on ${Tile.displayName(tile)}`
          }

          if (colonist) {
            return `Work on ${Tile.displayName(tile)}`
          }
        },
        args => {
          const { unit } = args

          let colonist = args.colonist
          if (unit) {
            JoinColony(colony, unit.colonist)
            colonist = unit.colonist
          }

          const options = Tile.fieldProductionOptions(tile, colonist)
          const decision = options.reduce(
            (best, pack) => (pack.amount > best.amount ? pack : best),
            { amount: 0, good: 'food' }
          )
          Colonist.beginFieldWork(colonist, tile, decision.good)

          return true
        }
      )

      return [destroySprites, destroyDrag, destroyHarvester]
    })
  })

  const unsubscribeCenter = Tile.listen.tile(center, center => {
    const colonySprite = Resources.sprite('map', {
      frame: MAP_COLONY_FRAME_ID,
    })
    colonySprite.position.x = 1.25 * TILE_SIZE
    colonySprite.position.y = 1.25 * TILE_SIZE
    colonySprite.scale.x = 0.5
    colonySprite.scale.y = 0.5
    container.tiles.addChild(colonySprite)

    return () => {
      container.tiles.removeChild(colonySprite)
    }
  })

  // container.tiles.position.x = originalDimensions.x - 450
  // container.tiles.position.y = originalDimensions.y - 450 - 121
  // container.tiles.scale.set(450 / (3 * TILE_SIZE))
  // container.colonists.position.x = originalDimensions.x - 450
  // container.colonists.position.y = originalDimensions.y - 450 - 121
  // container.colonists.scale.set(450 / (3 * TILE_SIZE))
  container.tiles.position.x = 0
  container.tiles.position.y = 0
  container.tiles.scale.set(450 / (3 * TILE_SIZE))
  container.colonists.position.x = 0
  container.colonists.position.y = 0
  container.colonists.scale.set(450 / (3 * TILE_SIZE))

  const unsubscribe = [unsubscribeTiles, unsubscribeCenter]

  return {
    unsubscribe,
    container,
  }
}

export default { create }
