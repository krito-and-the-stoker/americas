import * as PIXI from 'pixi.js'

import BuildingData from 'data/buildings'
import Goods from 'data/goods'
import Triangles from 'data/triangles/index.js'

import Util from 'util/util'

import Drag from 'input/drag'
import Click from 'input/click'
import Hover from 'input/hover'

import Production from 'entity/production'
import Unit from 'entity/unit'
import Colonist from 'entity/colonist'
import Colony from 'entity/colony'
import Building from 'entity/building'
import Buildings from 'entity/buildings'
import Construction from 'entity/construction'

import JoinColony from 'interaction/joinColony'

import Resources from 'render/resources'
import Dialog from 'view/ui/dialog'

import ProductionView from 'view/production'

import ColonistView from 'view/colony/colonist'

const TILE_SIZE = 64

const WIDTH = 128
const HEIGHT = 64
const OFFSET_X = 0.5 * WIDTH
const OFFSET_Y = 1.5 * HEIGHT
const PADDING_X = 64
const PADDING_Y = 32

const placementRectangle = (colony, placement) => {
  const data = placement.triangle
  return new PIXI.Rectangle(
    OFFSET_X + data.position.x * WIDTH - PADDING_X,
    OFFSET_Y + data.position.y * HEIGHT - PADDING_Y,
    data.width * WIDTH + 2 * PADDING_X,
    data.height * HEIGHT + 2 * PADDING_Y,
  )
}

const createBuilding = (colony, building) => {
  const container = {
    building: new PIXI.Container(),
    colonists: new PIXI.Container(),
  }

  const name = building.name
  const unsubscribePlacement = building.placement.map(placement => {
    const rectangle = placementRectangle(colony, placement)
    if (!rectangle || !placement.position) {
      return null
    }
    const sprite = Resources.sprite('triangles', { rectangle })
    sprite.x = placement.position.x * WIDTH
    sprite.y = placement.position.y * HEIGHT
    container.building.addChild(sprite)

    const unsubscribeDrag = Drag.makeDragTarget(
      () => {
        return [sprite].concat(container.colonists.children)
      },
      args => {
        const { unit, colonist } = args
        if (colony.disbanded) {
          return
        }

        if (colonist?.unit && Building.canEmploy(building, colonist.unit.expert)) {
          return `Let colonist work in ${name}`
        }

        if (unit && unit.properties.canJoin) {
          if (Building.canEmploy(building, unit.expert)) {
            return `Join colony and start working in ${name}`
          }
        }
      },
      ({ colonist, unit }) => {
        if (unit) {
          JoinColony(colony, unit.colonist)
          Colonist.beginColonyWork(unit.colonist, building)
        }

        if (colonist) {
          Colonist.beginColonyWork(colonist, building)
        }
      }
    )

    // TODO: Implement a nice detailed popup
    const unsubscribeClick = Buildings[building.name].isInteractive(building) &&
      Click.on(sprite, () => {
      	console.log(building)
        if (building.name === 'carpenters') {
          const options = Construction.options(colony)

          const prepareOption = option => ({
            ...option,
            cost: option.cost(),
            start: () => Construction.start(colony, option),
            percentage: () => Math.floor((100 * option.progress()) / Util.sum(Object.values(option.cost()))),
          })

          return Dialog.open('colony.construction', {
            newBuildings: options.newBuildings.map(prepareOption),
            upgradeBuildings: options.upgradeBuildings.map(prepareOption),
            units: options.units.map(prepareOption),
            stop: () => Construction.start(colony, null)
          })
        }
      }, `Inspect ${Building.name(colony, building.name)}`)
    const unsubscribeHover = Hover.track(sprite, { type: 'building', building })

    return [
      unsubscribeDrag,
      unsubscribeClick,
      unsubscribeHover,
    ]
  })


  const createColonistView = (productionBonus, colonist, work) => {
    if (work && work.building === building) {
      const position = {
        x:
          (work.position * 92) /
          (Building.workspace(colony, work.building.name) || 1) + 64,
        y: 20 + 32,
      }
      const colonistSprite = ColonistView.create(colonist)
      colonistSprite.x = position.x
      colonistSprite.y = position.y
      colonistSprite.scale.set(1.25)
      container.colonists.addChild(colonistSprite)

      const unsubscribeEducation = Colonist.listen.beingEducated(colonist, beingEducated => {
        if (beingEducated) {
          const bookSprite = Resources.sprite('map', {
            frame: Goods.books.id,
          })
          bookSprite.scale.set(0.5)
          bookSprite.x = 0.5 * TILE_SIZE
          bookSprite.y = 0
          colonistSprite.addChild(bookSprite)
          return () => {
            colonistSprite.removeChild(bookSprite)
          }
        }
      })

      const production = Production.production(colony, building, colonist)
      if (production) {
        const productionSprites = ProductionView.create(
          production.good,
          Math.round(production.amount),
          TILE_SIZE / 4
        )
        productionSprites.forEach(s => {
          s.position.x += position.x
          s.position.y += position.y + 3 * TILE_SIZE / 4
          s.scale.set(0.66)
          container.colonists.addChild(s)
        })
        return [
          Colonist.listen.state(colonist, () => {
            colonistSprite.tint = ColonistView.tint(colonist)
          }),
          () => {
            productionSprites.forEach(s => container.colonists.removeChild(s))
            container.colonists.removeChild(colonistSprite)
          },
          Click.on(
            colonistSprite,
            () => ColonistView.createDetailView(colonist),
            'View details'
          ),
          Hover.track(
            colonistSprite,
            { type: 'colonist', colonist }
          ),
          Drag.makeDraggable(
            colonistSprite,
            { colonist },
            'Move to field or other building to change production'
          ),
        ]
      }

      return [
        () => {
          container.colonists.removeChild(colonistSprite)
        },
        Click.on(
          colonistSprite,
          () => ColonistView.createDetailView(colonist),
          'View details'
        ),
        Hover.track(
          colonistSprite,
          { type: 'colonist', colonist }
        ),
        Drag.makeDraggable(
          colonistSprite,
          { colonist },
          'Move to field or other building to change production'
        ),
        unsubscribeEducation,
      ]
    }
  }

  const unsubscribeColonists = Colony.listen.productionBonus(colony, productionBonus =>
    Colony.listen.colonists(colony, colonists =>
      colonists.map(colonist =>
        Colonist.listen.work(
          colonist,
          work =>
            colonist?.unit &&
            Unit.listen.expert(colonist.unit, () =>
              Colonist.listen.state(colonist, () =>
                createColonistView(productionBonus, colonist, work)
              )
            )
        )
      )
    )
  )

  const unsubscribe = [
    unsubscribeColonists,
    unsubscribePlacement
  ]

  return {
    container,
    unsubscribe,
  }
}

const create = colony => {
  const container = {
    buildings: new PIXI.Container(),
    colonists: new PIXI.Container(),
  }

  const unsubscribe = Colony.listen.newBuildings(colony, buildings =>
    buildings.map(building => {
      const buildingView = createBuilding(colony, building)
      if (buildingView) {
        buildingView.container.colonists.x = building.placement[0].position.x * WIDTH
        buildingView.container.colonists.y = building.placement[0].position.y * HEIGHT
        container.buildings.addChild(buildingView.container.building)
        container.colonists.addChild(buildingView.container.colonists)

        return () => {
          Util.execute(buildingView.unsubscribe)
          container.buildings.removeChild(buildingView.container.building)
          container.colonists.removeChild(buildingView.container.colonists)
        }
      }
    })
  )

  return {
    container,
    unsubscribe,
  }
}

export default { create }
