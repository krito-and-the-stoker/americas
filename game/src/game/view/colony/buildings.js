import * as PIXI from 'pixi.js'

import Buildings from 'data/buildings'
import Goods from 'data/goods'
import Triangles from 'data/triangles'

import Util from 'util/util'

import Drag from 'input/drag'
import Click from 'input/click'
import Hover from 'input/hover'

import Production from 'entity/production'
import Unit from 'entity/unit'
import Colonist from 'entity/colonist'
import Colony from 'entity/colony'
import Building from 'entity/building'
import Construction from 'entity/construction'

import JoinColony from 'interaction/joinColony'

import Resources from 'render/resources'
import Dialog from 'view/ui/dialog'

import ProductionView from 'view/production'

import ColonistView from 'view/colony/colonist'

const TILE_SIZE = 64

const WIDTH = 256
const HEIGHT = 128
const buildingRectangle = (colony, building) => {
  const position = Triangles[building.name] ?? {
    x: 0,
    y: 31
  }

  return new PIXI.Rectangle(
    position.x * WIDTH,
    position.y * HEIGHT,
    WIDTH,
    HEIGHT,
  )
}

const createBuilding = (colony, building) => {
  const container = {
    building: new PIXI.Container(),
    colonists: new PIXI.Container(),
  }

  const name = building.name
  const rectangle = buildingRectangle(colony, building)
  if (!rectangle || !building.position) {
    return null
  }
  const sprite = Resources.sprite('triangles', { rectangle })
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

      if (colonist?.unit && Colony.canEmploy(colony, name, colonist.unit.expert)) {
        return `Let colonist work in ${name}`
      }

      if (unit && unit.properties.canJoin) {
        if (Colony.canEmploy(colony, name, unit.expert)) {
          return `Join colony and start working in ${name}`
        }
      }
    },
    ({ colonist, unit }) => {
      if (unit) {
        JoinColony(colony, unit.colonist)
        Colonist.beginColonyWork(unit.colonist, name)
      }

      if (colonist) {
        Colonist.beginColonyWork(colonist, name)
      }
    }
  )

  // TODO: Implement a nice detailed popup
  const unsubscribeClick = (building.level > 0 || building.name === 'carpenters') &&
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
          buildings: options.buildings.map(prepareOption),
          units: options.units.map(prepareOption),
          stop: () => Construction.start(colony, null)
        })
      }
    }, `Inspect ${Building.name(colony, building.name)}`)

  const unsubscribeHover = Hover.track(sprite, { type: 'building', building })

  const createColonistView = (productionBonus, colonist, work) => {
    if (work && work.building === name) {
      const position = {
        x:
          (work.position * 128 * Buildings[work.building].width) /
          (Building.workspace(colony, work.building) || 1),
        y: 20,
      }
      const colonistSprite = ColonistView.create(colonist)
      colonistSprite.x = position.x
      colonistSprite.y = position.y
      colonistSprite.scale.set(1.5)
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

      const production = Production.production(colony, name, colonist)
      if (production) {
        const productionSprites = ProductionView.create(
          production.good,
          Math.round(production.amount),
          TILE_SIZE / 2
        )
        productionSprites.forEach(s => {
          s.position.x += position.x
          s.position.y += position.y + TILE_SIZE
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
    unsubscribeDrag,
    unsubscribeClick,
    unsubscribeHover
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

  const unsubscribe = Colony.listen.buildings(colony, buildings =>
    Object.values(buildings).map(building => {
      const buildingView = createBuilding(colony, building)
      if (buildingView) {
        buildingView.container.building.x = building.position.x * 128
        buildingView.container.building.y = building.position.y * 128
        buildingView.container.colonists.x = building.position.x * 128
        buildingView.container.colonists.y = building.position.y * 128
        container.buildings.addChild(buildingView.container.building)
        container.colonists.addChild(buildingView.container.colonists)

        return () => {
          Util.execute(buildingView.unsubscribe)
          container.buildings.removeChild(buildingView.container.building)
          container.colonists.removeChild(buildingView.container.colonists)
        }
      }
      if (building.name === 'fortifications' && building.level > 0) {
        const sprite = Resources.sprite([null, 'stockade', 'fort', 'fortress'][building.level])
        container.buildings.addChild(sprite)
        return () => {
          container.buildings.removeChild(sprite)
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
