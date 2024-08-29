import * as PIXI from 'pixi.js'
import LA from 'util/la'

import Drag from 'input/drag'
import Wheel from 'input/wheel'

import Layout from 'entity/layout'

import RenderView from 'render/view'

import Triangles from 'view/colony/buildings/triangles'
import type { Coordinates } from 'util/la'
import type { ColonyEntity } from 'entity/colony/types'



interface Dimensions {
  dimensions: Coordinates
}

interface WheelData {
  delta: Coordinates
  position: Coordinates
}

interface ContainerArgument {
  background: PIXI.Container
  buildings: PIXI.Container
  colonists: PIXI.Container
  water: PIXI.Container
}

const originalDimensions = {
  x: 1920.0,
  y: 1080.0,
}


const create = (colony: ColonyEntity, container: ContainerArgument) => {
  let initialCoords = { x: 0, y: 0 }
  let dragFactor = 1
  RenderView.updateWhenResized(({ dimensions }: Dimensions) => {
    dragFactor = originalDimensions.y / dimensions.x
  })

  let containerCoords = { x: 0, y: 0 }
  let minPosition = { x: 0, y: 0 }
  const sanitizePosition = (newPosition: Coordinates) => {
    const minX = -Triangles.WIDTH
    const minY = -Triangles.HEIGHT
    if (newPosition.x > minX) {
      newPosition.x = minX
    }
    if (newPosition.x < minPosition.x) {
      newPosition.x = minPosition.x
    }

    if (newPosition.y > minY) {
      newPosition.y = minY
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

    container.background.position.x = newPosition.x
    container.background.position.y = newPosition.y
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
      x: (Layout.dimensions(colony.layout).x - 1) * Triangles.WIDTH,
      y: (Layout.dimensions(colony.layout).y - 1) * Triangles.HEIGHT,
    }
    minPosition = {
      x: -colonyDimensions.x * zoomScale + originalDimensions.x,
      y: -colonyDimensions.y * zoomScale + originalDimensions.y,
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

    const width = originalDimensions.x * scale
    const height = originalDimensions.y * scale
    const colonyDimensions = {
      x: Layout.dimensions(colony.layout).x * Triangles.WIDTH,
      y: Layout.dimensions(colony.layout).y * Triangles.HEIGHT,
    }
    minZoom = Math.max(width / (colonyDimensions.x - 2*Triangles.WIDTH), height / (colonyDimensions.y - 2*Triangles.HEIGHT)) / scale
    updateMinPosition()
  })

  const firstBuilding = colony.newBuildings.find(
    building => building.placement[0] && building.placement[0].position
  )
  if (firstBuilding) {
    containerCoords.x = 0.5 * originalDimensions.x - firstBuilding.placement[0].position.x * Triangles.WIDTH
    containerCoords.y = 0.5 * originalDimensions.y - firstBuilding.placement[0].position.y * Triangles.HEIGHT

    containerCoords = sanitizePosition(containerCoords)

    container.background.position.x = containerCoords.x
    container.background.position.y = containerCoords.y
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
    container.background.scale.set(zoomScale)
    container.buildings.scale.set(zoomScale)
    container.colonists.scale.set(zoomScale)
    container.water.scale.set(zoomScale)
    updateMinPosition()

    const center = container.buildings.toLocal(position)
    const offset = LA.multiply((1.0 - deltaFactor) * zoomScale, center)
    containerCoords = LA.add(containerCoords, offset)
    containerCoords = sanitizePosition(containerCoords)

    container.background.position.x = containerCoords.x
    container.background.position.y = containerCoords.y
    container.buildings.position.x = containerCoords.x
    container.buildings.position.y = containerCoords.y
    container.colonists.position.x = containerCoords.x
    container.colonists.position.y = containerCoords.y
    container.water.position.x = containerCoords.x
    container.water.position.y = containerCoords.y
  }

  return [
    // @ts-ignore
    Drag.on(container.capture, dragStart, dragMove, dragEnd, { highlight: false, type: 'colony' }),
    Wheel.on(handleWheel),
  ]
}

export default {
  create
}