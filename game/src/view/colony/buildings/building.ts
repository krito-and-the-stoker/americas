import * as PIXI from 'pixi.js'

import Util from 'util/util'

import Drag from 'input/drag'
import Click from 'input/click'
import Hover from 'input/hover'

import Colonist from 'entity/colonist'
import Building from 'entity/building'
import Construction from 'entity/construction'

import JoinColony from 'interaction/joinColony'

import Resources from 'render/resources'

import Dialog from 'view/ui/dialog'
import Triangles from 'view/colony/buildings/triangles'


import type { Placement } from 'view/colony/buildings/triangles'
import type { ColonyEntity, BuildingEntity } from '.'


import BuildingColonists from './colonists'
const create = (colony: ColonyEntity, building: BuildingEntity) => {
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
    const sprite = Resources.sprite('triangles', { rectangle })
    sprite.x = placement.position.x * Triangles.WIDTH
    sprite.y = placement.position.y * Triangles.HEIGHT
    sprite.hitArea = Triangles.hitArea(placement)
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