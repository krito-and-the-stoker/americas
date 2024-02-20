import BuildingData from 'data/buildings.json'

import Util from 'util/util'
import Message from 'util/message'
import Events from 'util/events'

import Colony from 'entity/colony'


const positions = Util.range(11)
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

const make = name => {
  const create = colony => {
    const building = {
      name,
      level: 1,
      colony,
      width: BuildingData[name].width,
      position: Util.choose(positions),
    }

    initialize(building)

    return building
  }

  const initialize = building => {

  }

  const display = building => {
    return (
      BuildingData[name].name[building.level] ||
      BuildingData[name].name[BuildingData[name].name.length - 1]
    )
  }

  const upgradeDisplay = building => {
    const level = building ? building.level + 1 : 1
    return (
      BuildingData[name].name[level] ||
      BuildingData[name].name[BuildingData[name].name.length - 1]
    )
  }

  const cost = () => {
    return BuildingData[name].cost[1]
  }

  const upgradeCost = building => {
    const buildingLevel = building.level

    return (
      BuildingData[name].cost[buildingLevel + 1] ||
      BuildingData[name].cost[BuildingData[name].cost.length - 1]
    )
  }

  const workspace = building =>
    (BuildingData[name].workspace.length
      ? BuildingData[name].workspace[building.level]
      : BuildingData[name].workspace) || 0


  return {
    create,
    initialize,
    display,
    upgradeDisplay,
    cost,
    upgradeCost,
    workspace
  }
}

export default {
  make
}