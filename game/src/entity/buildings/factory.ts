import BuildingData from 'data/buildings.json'
import Triangles from 'data/triangles'
import Goods from 'data/goods.json'

import Util from 'util/util'
import Record from 'util/record'
import Binding from 'util/binding'

import Colony from 'entity/colony'
import Layout from 'entity/layout'

import { BuildingEntity } from 'view/colony/buildings'
import { ColonyEntity } from 'entity/colony/types'
import { ColonistEntity } from 'entity/colonist/types'
import { CleanupExec, Function1 } from 'signal-chain'


export const positions = Util.range(11)
  .map(x =>
    Util.range(5).map(y => ({
      x,
      y,
      width: x >= 4 && x <= 6 ? 2 : 1,
      taken: false,
    }))
  )
  .flat()
  .filter(({ x, y }) => x >= 3 && x <= 8 && y >= 1 && y <= 3 && (x <= 7 || y >= 2))

const save = (building: BuildingEntity) => ({
  ...building,
  colony: Record.reference(building.colony)
})

const load = (building: BuildingEntity) => {
  Record.dereferenceLazy(building.colony, (entity: ColonyEntity) => {
    building.colony = entity
  })

  Record.entitiesLoaded(() => {
    building.destroy = initialize(building)
  })

  return building
}


const upgradeCost = (building: BuildingEntity) => {
  const buildingLevel = building.level

  return (
    BuildingData[building.name].cost[buildingLevel + 1] ||
    BuildingData[building.name].cost[BuildingData[building.name].cost.length - 1]
  )
}

const workspace = (building: BuildingEntity) =>
  (BuildingData[building.name].workspace.length
    ? BuildingData[building.name].workspace[building.level]
    : BuildingData[building.name].workspace) || 0

const initialize = (building: BuildingEntity): CleanupExec => {
  return [
    listen.level(building, () => {
      if (building.placement.length === 0) {
        const colony = building.colony

        building.placement = [
          Layout.placeBuilding(colony, building),
        ].filter(x => !!x)
        Colony.update.newBuildings(colony)
      }

      return () => {
        Layout.removeBuilding(building.colony, building)
        building.placement = []
      }
    })
  ]
}


const upgradeDisplay = (building: BuildingEntity) => {
  const level = building ? building.level + 1 : 1
  return (
    BuildingData[building.name].name[level] ||
    BuildingData[building.name].name[BuildingData[building.name].name.length - 1]
  )
}

const isInteractive = (building: BuildingEntity) => {
  return building.name === 'carpenters'
}

const production = (building: BuildingEntity, colonist: ColonistEntity) => {
  const good = BuildingData[building.name].production.good
  let amount = BuildingData[building.name].production.amount[building.level]
  if (!colonist.state.noLuxury && colonist.unit?.expert === Goods[good].expert) {
    amount *= 3
  }

  return { amount, good }
}

const consumption = (building: BuildingEntity) => {
  const good = BuildingData[building.name].consumption ? BuildingData[building.name].consumption.good : null
  const factor = BuildingData[building.name]?.consumption?.factor ?? 1

  if (good) {
    return {
      good,
      factor
    }
  }
}

const canEmploy = (building: BuildingEntity) => {
  return building.colony.colonists
    .filter(colonist => colonist.work?.type === 'Building' && colonist.work.building === building)
    .length < workspace(building)
}

const update = {
  level: (building: BuildingEntity, level: number) => Binding.update(building, 'level', level)
}

const listen = {
  level: (building: BuildingEntity, fn: Function1<number, CleanupExec>) => Binding.listen(building, 'level', fn)
}


const make = (name: string) => {
  const create = (colony: ColonyEntity, level = 1) => {
    const building: BuildingEntity = {
      name,
      level,
      colony,
      width: BuildingData[name].width,
      height: 1,
      placement: [],
      destroy: null,

      get triangles() {
        return (Triangles as any)[name] || Triangles.empty
      },
    }

    building.destroy = initialize(building)

    Record.add('building', building)
    return building
  }

  const display = (building: BuildingEntity) => {
    const level = building?.level ?? 1
    return (
      BuildingData[name].name[level] ||
      BuildingData[name].name[BuildingData[name].name.length - 1]
    )
  }

  const cost = () => {
    return BuildingData[name].cost[1]
  }

  return {
    create,
    production,
    consumption,
    load,
    save,
    display,
    upgradeDisplay,
    cost,
    canEmploy,
    upgradeCost,
    workspace,
    isInteractive,
    update,
  }
}

export default {
  make,
  listen
}