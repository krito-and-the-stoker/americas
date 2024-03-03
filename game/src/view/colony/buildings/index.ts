import * as PIXI from 'pixi.js'

import Util from 'util/util'

import Click from 'input/click'

import Colony from 'entity/colony'

import Resources from 'render/resources'

import Water from 'view/colony/buildings/water'
import Triangles from 'view/colony/buildings/triangles'
import BuildingView from 'view/colony/buildings/building'
import Navigation from 'view/colony/buildings/navigation'

import type { Placement } from 'view/colony/buildings/triangles'


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
