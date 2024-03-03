import * as PIXI from 'pixi.js'

import Util from 'util/util'
import LA from 'util/la'

import Drag from 'input/drag'
import Click from 'input/click'
import Wheel from 'input/wheel'

import Colony from 'entity/colony'
import Layout from 'entity/layout'

import Resources from 'render/resources'
import RenderView from 'render/view'

import Water from 'view/colony/buildings/water'
import Triangles from 'view/colony/buildings/triangles'
import BuildingView from 'view/colony/buildings/building'

import type { Placement } from 'view/colony/buildings/triangles'
import { Coordinates } from 'util/types'


export interface ColonyEntity {
  disbanded: boolean
  newBuildings: BuildingEntity[]
  waterMap: any
  layout: any
}

export interface BuildingEntity {
  name: string
  placement: Placement[]
  colony: ColonyEntity
}

interface Dimensions {
  dimensions: Coordinates
}

interface WheelData {
  delta: Coordinates
  position: Coordinates
}

const create = (colony: ColonyEntity) => {
  const container = {
    background: new PIXI.Container(),
    buildings: new PIXI.Container(),
    colonists: new PIXI.Container(),
    water: new PIXI.Container(),
  }

  const waterSprites = Water.create(colony)
  waterSprites.forEach(sprite => container.water.addChild(sprite))

  // const background = Resources.sprite('colonyBackground')
  const background = new PIXI.Graphics();
  background.beginFill(0x43602a, 1); // light green
  // background.beginFill(0x41492a, 1); // the dark green
  // background.beginFill(0x838165, 1); // the grey of the buildings floor
  background.drawRect(0, 0, 1920, 1080); // Change these values as needed
  background.endFill();

  container.background.addChild(background)

  const ground = new PIXI.TilingSprite(Resources.texture('colonyBackground'), 1920, 1080)
  container.background.addChild(ground)

  // capture click on background so we dont close the screen
  const unsubscribeClick = Click.on(background)

  const originalDimensions = {
    x: background.width,
    y: background.height,
  }

  let initialCoords = { x: 0, y: 0 }
  let dragFactor = 1
  RenderView.updateWhenResized(({ dimensions }: Dimensions) => {
    dragFactor = 1920.0 / dimensions.x
  })


  let containerCoords = { x: 0, y: 0 }
  let minPosition = { x: 0, y: 0 }
  const sanitizePosition = (newPosition: Coordinates) => {
    if (newPosition.x > 0) {
      newPosition.x = 0
    }
    if (newPosition.x < minPosition.x) {
      newPosition.x = minPosition.x
    }

    if (newPosition.y > 0) {
      newPosition.y = 0
    }
    if (newPosition.y < minPosition.y) {
      newPosition.y = minPosition.y
    }

    return newPosition
  }

  const dragStart = (coords: Coordinates) => {
    initialCoords = coords
  }

  const dragMove = (coords: Coordinates) => {
    const cursorDelta = LA.multiply(dragFactor, LA.subtract(coords, initialCoords))
    const newPosition = sanitizePosition(LA.add(containerCoords, cursorDelta))

    container.buildings.position.x = newPosition.x
    container.buildings.position.y = newPosition.y
    container.colonists.position.x = newPosition.x
    container.colonists.position.y = newPosition.y
    container.water.position.x = newPosition.x
    container.water.position.y = newPosition.y
  }
  const dragEnd = (coords: Coordinates) => {
    containerCoords = LA.add(containerCoords, LA.multiply(dragFactor, LA.subtract(coords, initialCoords)))
  }

  let zoomScale = 1.0
  let minZoom = 0
  const updateMinPosition = () => {
    const colonyDimensions = {
      x: Layout.dimensions(colony.layout).x * Triangles.WIDTH,
      y: Layout.dimensions(colony.layout).y * Triangles.HEIGHT,
    }
    minPosition = {
      x: -colonyDimensions.x * zoomScale + 1920.0,
      y: -colonyDimensions.y * zoomScale + 1080.0,
    }
  }
  let scale = 1.0
  let dimensions = {
    ...originalDimensions
  }
  RenderView.updateWhenResized((renderView: Dimensions) => {
    dimensions = renderView.dimensions
    const scaleX = dimensions.x / originalDimensions.x
    const scaleY = dimensions.y / originalDimensions.y
    scale = 0.9 * Math.min(scaleX, scaleY)

    const width = 1920.0 * scale
    const height = 1080.0 * scale
    const colonyDimensions = {
      x: Layout.dimensions(colony.layout).x * Triangles.WIDTH,
      y: Layout.dimensions(colony.layout).y * Triangles.HEIGHT,
    }
    minZoom = Math.max(width / colonyDimensions.x, height / colonyDimensions.y) / scale
    updateMinPosition()
  })

  const firstBuilding = colony.newBuildings.find(
    building => building.placement[0] && building.placement[0].position
  )
  if (firstBuilding) {
    containerCoords.x = 0.5 * originalDimensions.x - firstBuilding.placement[0].position.x * Triangles.WIDTH
    containerCoords.y = 0.5 * originalDimensions.y - firstBuilding.placement[0].position.y * Triangles.HEIGHT

    containerCoords = sanitizePosition(containerCoords)

    container.buildings.position.x = containerCoords.x
    container.buildings.position.y = containerCoords.y
    container.colonists.position.x = containerCoords.x
    container.colonists.position.y = containerCoords.y
    container.water.position.x = containerCoords.x
    container.water.position.y = containerCoords.y
  }


  const ZOOM_FACTOR = 0.001
  const handleWheel = ({ delta, position }: WheelData) => {
    const deltaFactor = Math.exp(-ZOOM_FACTOR * delta.y)
    if (deltaFactor * zoomScale < minZoom) {
      return
    }

    zoomScale *= deltaFactor
    container.buildings.scale.set(zoomScale)
    container.colonists.scale.set(zoomScale)
    container.water.scale.set(zoomScale)
    updateMinPosition()

    const center = container.buildings.toLocal(position)
    const offset = LA.multiply((1.0 - deltaFactor) * zoomScale, center)
    containerCoords = LA.add(containerCoords, offset)
    containerCoords = sanitizePosition(containerCoords)

    container.buildings.position.x = containerCoords.x
    container.buildings.position.y = containerCoords.y
    container.colonists.position.x = containerCoords.x
    container.colonists.position.y = containerCoords.y
    container.water.position.x = containerCoords.x
    container.water.position.y = containerCoords.y
  }


  const unsubscribe = [
    unsubscribeClick,
    Colony.listen.newBuildings(colony, (buildings: BuildingEntity[]) =>
      buildings.map(building => {
        const buildingView = BuildingView.create(colony, building)
        if (buildingView) {
          buildingView.container.colonists.x = building.placement[0]?.position.x * Triangles.WIDTH || 0
          buildingView.container.colonists.y = building.placement[0]?.position.y * Triangles.HEIGHT || 0
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
    // @ts-ignore
    Drag.on(background, dragStart, dragMove, dragEnd, { highlight: false }),
    Wheel.on(handleWheel),
  ]

  return {
    container,
    unsubscribe,
  }
}

export default { create }
