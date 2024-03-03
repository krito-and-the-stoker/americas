import * as PIXI from 'pixi.js'

import Water from 'data/triangles/water'
import Layout from 'entity/layout'
import Util from 'util/util'

import Triangles from 'view/colony/buildings/triangles'
import Resources from 'render/resources'

import type { ShapeIterator } from 'entity/layout'
import type { TriangleView } from './triangles'
import type { ColonyEntity } from 'view/colony/buildings'


const create = (colony: ColonyEntity): PIXI.Sprite[] => {
  const isLand = ({ x, y, shape }: ShapeIterator) => Layout.canPutTriangle(colony.waterMap, x, y, shape)
  const hasBuildingOrWater = ({ x, y, shape }: ShapeIterator) => !Layout.canPutTriangle(colony.layout, x, y, shape)
  const calculateProfile = Layout.borderProfile(
    iterator => iterator.some(isLand)
      && iterator.every(hasBuildingOrWater)
  )
  return Util.flatten(Layout.iterate(colony.waterMap).map(({ x, y, shape }) => {
    let triangles: TriangleView[] = []
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

    return triangles.map(triangle => {
      const rectangle = Triangles.placementRectangle(triangle)
      const sprite = Resources.sprite('triangles', { rectangle })
      sprite.x = x * Triangles.WIDTH
      sprite.y = y * Triangles.HEIGHT
      return sprite
    })
  }))
}

export default {
  create
}