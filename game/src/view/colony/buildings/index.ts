import type { ColonyEntity } from 'entity/colony/types'
import type { Placement, TriangleView } from 'view/colony/buildings/triangles'
import type { CleanupExec } from 'util/types'
import * as PIXI from 'pixi.js'

import Util from 'util/util'

import Click from 'input/click'

import Colony from 'entity/colony'

import Resources from 'render/resources'

import Water from 'view/colony/buildings/water'
import Triangles from 'view/colony/buildings/triangles'
import BuildingView from 'view/colony/buildings/building'
import Navigation from 'view/colony/buildings/navigation'



export interface BuildingEntity {
  name: string
  placement: Placement[]
  colony: ColonyEntity
  level: number
  triangles: {
    level: {
      [level: number]: TriangleView[]
    }
  }
  width: number
  height: number
  referenceId: number
  destroy: CleanupExec
}


const originalDimensions = {
  x: 1920.0,
  y: 1080.0,
}


const create = (colony: ColonyEntity) => {
  const container = {
    capture: new PIXI.Container(),
    background: new PIXI.Container(),
    buildings: new PIXI.Container(),
    colonists: new PIXI.Container(),
    water: new PIXI.Container(),
  }

  const waterSprites = Water.create(colony)
  waterSprites.forEach(sprite => container.water.addChild(sprite))

  // 40 * 128: colony.layout.length.x * TILE.WIDTH
  // 40 * 64: colony.layout.length.y * TILE.HEIGHT
  const ground = new PIXI.TilingSprite(Resources.texture('colonyBackground'), 40 * 128, 40 * 64)
  container.background.addChild(ground)

  // capture click on background so we dont close the screen
  // capture area will also be used for drag
  container.capture.hitArea = new PIXI.Rectangle(0, 0, originalDimensions.x, originalDimensions.y)
  const unsubscribeClick = Click.on(container.capture)


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
    Navigation.create(colony, container),
  ]

  return {
    container,
    unsubscribe,
  }
}

export default { create }
