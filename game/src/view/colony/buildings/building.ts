import * as PIXI from 'pixi.js'

import Util from 'util/util'

import Drag from 'input/drag'
import Click from 'input/click'
import Hover from 'input/hover'

import Colonist from 'entity/colonist'
import Colony from 'entity/colony'
import Building from 'entity/building'
import Construction from 'entity/construction'
import Layout from 'entity/layout'

import JoinColony from 'interaction/joinColony'

import Resources from 'render/resources'

import Dialog from 'view/ui/dialog'
import Triangles from 'view/colony/buildings/triangles'


import type { Placement } from 'view/colony/buildings/triangles'
import type { ColonyEntity } from 'entity/colony/types'
import type { BuildingEntity } from '.'

import BuildingColonists from './colonists'


const create = (colony: ColonyEntity, building: BuildingEntity) => {
  console.log('reflow fn setup for colony', colony.name)
  // @ts-ignore
  window.reflow = () => {
    colony.newBuildings.forEach(building => {
      Layout.removeBuilding(colony, building)
    })

    colony.newBuildings.forEach(building => {
      building.placement = [Layout.placeBuilding(colony, building)].filter(x => !!x)
    })

    Colony.update.newBuildings(colony)
    console.log('reflowed', colony.name)
  }

  const container = {
    building: new PIXI.Container(),
    colonists: new PIXI.Container(),
  }

  const name = building.name
  const unsubscribePlacement = building.placement.map((placement: Placement) => {
    const rectangle = Triangles.placementRectangle(placement.triangle)
    if (!rectangle || !placement.position) {
      return null
    }
    const texture = placement.triangle.texture ?? 'triangles'
    if (texture !== 'triangles') {
      console.log('found non triangles', placement, building)
    }
    const sprite = Resources.sprite(texture, { rectangle })
    sprite.x = placement.position.x * Triangles.WIDTH
    sprite.y = placement.position.y * Triangles.HEIGHT
    sprite.hitArea = Triangles.hitArea(placement)
    sprite.scale.set(1.0 / Resources.getResolution(texture))
    container.building.addChild(sprite)

    const unsubscribeDrag = Drag.makeDragTarget(
      () => {
        return [sprite, ...container.colonists.children]
      },
      (args: any) => {
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
      ({ colonist, unit }: any) => {
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
    const unsubscribeClick = Building.isInteractive(building) &&
      Click.on(sprite, () => {
        if (building.name === 'carpenters') {
          const options = Construction.options(colony)

          const prepareOption = (option: any) => ({
            ...option,
            start: () => Construction.start(colony, option),
            percentage: Math.floor((100 * option.progress) / Util.sum(Object.values(option.cost))),
          })

          return Dialog.open('colony.construction', {
            newBuildings: options.newBuildings.map(prepareOption),
            upgradeBuildings: options.upgradeBuildings.map(prepareOption),
            units: options.units.map(prepareOption),
            stop: () => Construction.start(colony, null)
          })
        }
      }, `Inspect ${Building.name(colony, building.name)}`)
    // only interactive buildings can be hovered
    const unsubscribeHover = Building.isInteractive(building)
      && Hover.track(sprite, { type: 'building', building })

    return [
      unsubscribeDrag,
      unsubscribeClick,
      unsubscribeHover,
    ]
  })

  const unsubscribe = [
    BuildingColonists.create(building, container.colonists),
    unsubscribePlacement
  ]

  return {
    container,
    unsubscribe,
  }
}

export default {
  create
}