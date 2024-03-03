import * as PIXI from 'pixi.js'
import type { Coordinates } from 'util/types'

import Layout from 'entity/layout'

const TILE_SIZE = 64
const WIDTH = 128
const HEIGHT = 64
const OFFSET_X = 0.5 * WIDTH
const OFFSET_Y = 1.5 * HEIGHT
const PADDING_X = 64
const PADDING_Y = 32

export type TriangleView = {
  position: Coordinates
  width: number
  height: number
}

interface HasContains {
  contains: (...args: any[]) => boolean
}

export interface Placement {
  triangle: any
  position: Coordinates
}

const multiHitArea = (array: HasContains[]) => ({
  contains: (...args: any[]) => array.some(elem => elem?.contains(...args))
})


const placementRectangle = (triangle: TriangleView) => {
  return new PIXI.Rectangle(
    OFFSET_X + triangle.position.x * WIDTH - PADDING_X,
    OFFSET_Y + triangle.position.y * HEIGHT - PADDING_Y,
    triangle.width * WIDTH + 2 * PADDING_X,
    triangle.height * HEIGHT + 2 * PADDING_Y,
  )
}

const hitArea = (placement: Placement) => {
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
      ]) as HasContains
    }
    if (shape === 2) {
      return new PIXI.Polygon([
        new PIXI.Point(offset.x, offset.y),
        new PIXI.Point(offset.x, offset.y + HEIGHT),
        new PIXI.Point(offset.x + WIDTH, offset.y + HEIGHT),
      ]) as HasContains
    }
    if (shape === 3) {
      return new PIXI.Polygon([
        new PIXI.Point(offset.x, offset.y + HEIGHT),
        new PIXI.Point(offset.x + WIDTH, offset.y + HEIGHT),
        new PIXI.Point(offset.x + WIDTH, offset.y),
      ]) as HasContains
    }
    if (shape === 4) {
      return new PIXI.Polygon([
        new PIXI.Point(offset.x, offset.y),
        new PIXI.Point(offset.x + WIDTH, offset.y + HEIGHT),
        new PIXI.Point(offset.x + WIDTH, offset.y),
      ]) as HasContains
    }
    if (shape === 5) {
      return new PIXI.Rectangle(
        offset.x,
        offset.y,
        WIDTH,
        HEIGHT,
      ) as HasContains
    }

    console.error('Unknown shape', shape)
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