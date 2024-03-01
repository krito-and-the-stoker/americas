import * as PIXI from 'pixi.js'

import Goods from 'data/goods'
import Water from 'data/triangles/water'

import Util from 'util/util'
import LA from 'util/la'

import Drag from 'input/drag'
import Click from 'input/click'
import Hover from 'input/hover'
import Wheel from 'input/wheel'

import Production from 'entity/production'
import Unit from 'entity/unit'
import Colonist from 'entity/colonist'
import Colony from 'entity/colony'
import Building from 'entity/building'
import Buildings from 'entity/buildings'
import Construction from 'entity/construction'
import Layout from 'entity/layout'

import JoinColony from 'interaction/joinColony'

import Resources from 'render/resources'
import RenderView from 'render/view'

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

const placementRectangle = triangle => {
  return new PIXI.Rectangle(
    OFFSET_X + triangle.position.x * WIDTH - PADDING_X,
    OFFSET_Y + triangle.position.y * HEIGHT - PADDING_Y,
    triangle.width * WIDTH + 2 * PADDING_X,
    triangle.height * HEIGHT + 2 * PADDING_Y,
  )
}

const multiHitArea = array => ({
  contains: (...args) => array.some(elem => elem?.contains(...args))
})

const hitArea = placement => {
  return multiHitArea(Layout.iterate(placement.triangle.shape).map(({ x, y, shape }) => {
    const offset = {
      x: PADDING_X + x * WIDTH,
      y: PADDING_Y + y * HEIGHT,
    }

    if (shape === 1) {
      return new PIXI.Polygon([
        new PIXI.Point(offset.x, offset.y),
        new PIXI.Point(offset.x, offset.y + HEIGHT),
        new PIXI.Point(offset.x + WIDTH, offset.y),
      ])
    }
    if (shape === 2) {
      return new PIXI.Polygon([
        new PIXI.Point(offset.x, offset.y),
        new PIXI.Point(offset.x, offset.y + HEIGHT),
        new PIXI.Point(offset.x + WIDTH, offset.y + HEIGHT),
      ])
    }
    if (shape === 3) {
      return new PIXI.Polygon([
        new PIXI.Point(offset.x, offset.y + HEIGHT),
        new PIXI.Point(offset.x + WIDTH, offset.y + HEIGHT),
        new PIXI.Point(offset.x + WIDTH, offset.y),
      ])
    }
    if (shape === 4) {
      return new PIXI.Polygon([
        new PIXI.Point(offset.x, offset.y),
        new PIXI.Point(offset.x + WIDTH, offset.y + HEIGHT),
        new PIXI.Point(offset.x + WIDTH, offset.y),
      ])
    }
    if (shape === 5) {
      return new PIXI.Rectangle(
        offset.x,
        offset.y,
        WIDTH,
        HEIGHT,
      )
    }
  }))
}

const createBuilding = (colony, building) => {
  const container = {
    building: new PIXI.Container(),
    colonists: new PIXI.Container(),
  }

  const name = building.name
  const unsubscribePlacement = building.placement.map(placement => {
    const rectangle = placementRectangle(placement.triangle)
    if (!rectangle || !placement.position) {
      return null
    }
    const sprite = Resources.sprite('triangles', { rectangle })
    sprite.x = placement.position.x * WIDTH
    sprite.y = placement.position.y * HEIGHT
    sprite.hitArea = hitArea(placement)
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
        if (building.name === 'carpenters') {
          const options = Construction.options(colony)

          const prepareOption = option => ({
            ...option,
            start: () => Construction.start(colony, option),
            percentage: Math.floor((100 * option.progress) / Util.sum(Object.values(option.cost))),
          })

        	console.log(options)
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
    background: new PIXI.Container(),
    buildings: new PIXI.Container(),
    colonists: new PIXI.Container(),
    water: new PIXI.Container(),
  }

  if (colony.waterMap) {
    const isLand = ({ x, y, shape }) => Layout.canPutTriangle(colony.waterMap, x, y, shape)
    const hasBuildingOrWater = ({ x, y, shape }) => !Layout.canPutTriangle(colony.layout, x, y, shape)
    const calculateProfile = Layout.borderProfile(
      iterator => iterator.some(isLand)
        && iterator.every(hasBuildingOrWater)
    )
    Layout.iterate(colony.waterMap).forEach(({ x, y, shape }) => {
      let triangles = []
      if (shape > 0 && shape < 5) {
        const profile = calculateProfile({ x, y, shape })
        const candidates = Water.filter(entry => entry.border === profile)
        triangles = [candidates[shape - 1]]
      }
      if (shape === 5) {
        const profile1 = calculateProfile({ x, y, shape: 1 })
        const candidates1 = Water.filter(entry => entry.border === profile1)

        const profile2 = calculateProfile({ x, y, shape: 3 })
        const candidates2 = Water.filter(entry => entry.border === profile2)
        triangles = [candidates1[0], candidates2[2]]
      }

      triangles.forEach(triangle => {
        const rectangle = placementRectangle(triangle)
        const sprite = Resources.sprite('triangles', { rectangle })
        sprite.x = x * WIDTH
        sprite.y = y * HEIGHT
        container.water.addChild(sprite)
      })
    })
  }


  // const background = Resources.sprite('colonyBackground')
  const background = new PIXI.Graphics();
  background.beginFill(0x43602a, 1); // light green
  // background.beginFill(0x41492a, 1); // the dark green
  // background.beginFill(0x838165, 1); // the grey of the buildings floor
  background.drawRect(0, 0, 1920, 1080); // Change these values as needed
  background.endFill();

  container.background.addChild(background)

  // capture click on background so we dont close the screen
  const unsubscribeClick = Click.on(background)

  const originalDimensions = {
    x: background.width,
    y: background.height,
  }

  let initialCoords = { x: 0, y: 0 }
  let containerCoords = { x: 0, y: 0 }
  let dragFactor = 1
  RenderView.updateWhenResized(({ dimensions }) => {
    dragFactor = 1920.0 / dimensions.x
  })
  const dragStart = (coords) => {
    initialCoords = coords
  }

  const dragMove = (coords) => {
    const cursorDelta = LA.multiply(dragFactor, LA.subtract(coords, initialCoords))
    const newPosition = LA.add(containerCoords, cursorDelta)

    container.buildings.position.x = newPosition.x
    container.buildings.position.y = newPosition.y
    container.colonists.position.x = newPosition.x
    container.colonists.position.y = newPosition.y
    container.water.position.x = newPosition.x
    container.water.position.y = newPosition.y
  }
  const dragEnd = (coords) => {
    containerCoords = LA.add(containerCoords, LA.multiply(dragFactor, LA.subtract(coords, initialCoords)))
  }

  const ZOOM_FACTOR = 0.001
  let zoomScale = 1.0
  const handleWheel = ({ delta, position }) => {
    const deltaFactor = Math.exp(-ZOOM_FACTOR * delta.y)
    zoomScale *= deltaFactor
    container.buildings.scale.set(zoomScale)
    container.colonists.scale.set(zoomScale)
    container.water.scale.set(zoomScale)

    containerCoords = LA.madd(containerCoords, dragFactor * (1 - deltaFactor) / zoomScale, LA.subtract(position, containerCoords))
    container.buildings.position.x = containerCoords.x
    container.buildings.position.y = containerCoords.y
    container.colonists.position.x = containerCoords.x
    container.colonists.position.y = containerCoords.y
    container.water.position.x = containerCoords.x
    container.water.position.y = containerCoords.y
  }


  const unsubscribe = [
    unsubscribeClick,
    Colony.listen.newBuildings(colony, buildings =>
      buildings.map(building => {
        const buildingView = createBuilding(colony, building)
        if (buildingView) {
          buildingView.container.colonists.x = building.placement[0]?.position.x * WIDTH || 0
          buildingView.container.colonists.y = building.placement[0]?.position.y * HEIGHT || 0
          container.buildings.addChild(buildingView.container.building)
          container.colonists.addChild(buildingView.container.colonists)

          return () => {
            Util.execute(buildingView.unsubscribe)
            container.buildings.removeChild(buildingView.container.building)
            container.colonists.removeChild(buildingView.container.colonists)
          }
        }
      })
    ),
    Drag.on(background, dragStart, dragMove, dragEnd, { highlight: false }),
    Wheel.on(handleWheel),
  ]

  return {
    container,
    unsubscribe,
  }
}

export default { create }
