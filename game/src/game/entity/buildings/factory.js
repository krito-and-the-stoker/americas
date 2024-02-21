import BuildingData from 'data/buildings'
import Triangles from 'data/triangles'

import Util from 'util/util'
import Record from 'util/record'
import Message from 'util/message'
import Events from 'util/events'

import Colony from 'entity/colony'
import Layout from 'entity/layout'


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

const save = building => ({
  ...building,
  colony: Record.reference(building.colony)
})

const load = building => {
  return {
    ...building,
  colony: Record.dereferenceLazy(building.colony)
  }
}


const upgradeCost = building => {
  const buildingLevel = building.level

  return (
    BuildingData[building.name].cost[buildingLevel + 1] ||
    BuildingData[building.name].cost[BuildingData[building.name].cost.length - 1]
  )
}

const workspace = building =>
  (BuildingData[building.name].workspace.length
    ? BuildingData[building.name].workspace[building.level]
    : BuildingData[building.name].workspace) || 0

const initialize = building => {}


const upgradeDisplay = building => {
  const level = building ? building.level + 1 : 1
  return (
    BuildingData[building.name].name[level] ||
    BuildingData[building.name].name[BuildingData[building.name].name.length - 1]
  )
}


const make = name => {
  const create = colony => {
    const building = {
      name,
      level: 1,
      colony,
      width: BuildingData[name].width,
      height: 1,
      triangles: Triangles[name] || Triangles.empty,
    }

    building.placement = [Layout.placeBuilding(colony, building)]

    initialize(building)

    return building
  }

  const display = building => {
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
    load,
    save,
    initialize,
    display,
    upgradeDisplay,
    cost,
    upgradeCost,
    workspace,
    save,
    load,
  }
}

export default {
  make,
  load,
  save,
  initialize,
  upgradeDisplay,
  upgradeCost,
  workspace,
  save,
  load,
}