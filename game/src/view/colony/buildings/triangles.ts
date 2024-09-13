import * as PIXI from 'pixi.js'
import type { Coordinates } from 'util/la'

import Layout, { ShapeMap } from 'entity/layout'
import Resources from 'render/resources'


const TILE_SIZE = 64
const WIDTH = 128
const HEIGHT = 64
const OFFSET_X = 0.5 * WIDTH
const OFFSET_Y = 0.5 * HEIGHT
const PADDING_X = 64
const PADDING_Y = 32

const offsets_y: Record<string, number> = {
  'triangles': 1.5 * HEIGHT
}

export type TriangleView = {
  position: Coordinates
  width: number
  height: number
  shape: ShapeMap
  texture?: string
}

interface HasContains {
  contains: (...args: any[]) => boolean
}

export type Placement = {
  triangle: TriangleView
  position: Coordinates
}

const multiHitArea = (array: HasContains[]) => ({
  contains: (...args: any[]) => array.some(elem => elem?.contains(...args))
})


const placementRectangle = (triangle: TriangleView) => {
  const resolution = Resources.getResolution(triangle.texture ?? 'triangles')
  const offset_y = offsets_y[triangle.texture ?? 'triangles'] ?? OFFSET_Y

  return new PIXI.Rectangle(
    (OFFSET_X + triangle.position.x * WIDTH - PADDING_X) * resolution,
    (offset_y + triangle.position.y * HEIGHT - PADDING_Y) * resolution,
    (triangle.width * WIDTH + 2 * PADDING_X) * resolution,
    (triangle.height * HEIGHT + 2 * PADDING_Y) * resolution
  )
}

const hitArea = (placement: Placement) => {
  const resolution = Resources.getResolution(placement.triangle.texture ?? 'triangles');

  return multiHitArea(Layout.iterate(placement.triangle.shape).map(({ x, y, shape }) => {
    // Adjust the offset with the texture's resolution
    const offset = {
      x: (PADDING_X + x * WIDTH) * resolution,
      y: (PADDING_Y + y * HEIGHT) * resolution,
    }

    // Scale hit areas according to the resolution
    if (shape === 1) {
      return new PIXI.Polygon([
        new PIXI.Point(offset.x, offset.y),
        new PIXI.Point(offset.x, offset.y + HEIGHT * resolution),
        new PIXI.Point(offset.x + WIDTH * resolution, offset.y),
      ]) as HasContains;
    }
    if (shape === 2) {
      return new PIXI.Polygon([
        new PIXI.Point(offset.x, offset.y),
        new PIXI.Point(offset.x, offset.y + HEIGHT * resolution),
        new PIXI.Point(offset.x + WIDTH * resolution, offset.y + HEIGHT * resolution),
      ]) as HasContains;
    }
    if (shape === 3) {
      return new PIXI.Polygon([
        new PIXI.Point(offset.x, offset.y + HEIGHT * resolution),
        new PIXI.Point(offset.x + WIDTH * resolution, offset.y + HEIGHT * resolution),
        new PIXI.Point(offset.x + WIDTH * resolution, offset.y),
      ]) as HasContains;
    }
    if (shape === 4) {
      return new PIXI.Polygon([
        new PIXI.Point(offset.x, offset.y),
        new PIXI.Point(offset.x + WIDTH * resolution, offset.y + HEIGHT * resolution),
        new PIXI.Point(offset.x + WIDTH * resolution, offset.y),
      ]) as HasContains;
    }
    if (shape === 5) {
      return new PIXI.Rectangle(
        offset.x,
        offset.y,
        WIDTH * resolution,
        HEIGHT * resolution
      ) as HasContains;
    }

    // Fallback for unknown shapes
    console.error('Unknown shape', shape);
    return {
      contains: () => false,
    }
  }))
}



export default {
  placementRectangle,
  hitArea,
  WIDTH,
  HEIGHT,
  TILE_SIZE,
}