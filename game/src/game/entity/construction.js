import BuildingData from 'data/buildings'
import Units from 'data/units'

import Util from 'util/util'
import Events from 'util/events'
import Message from 'util/message'

import Buildings from 'entity/buildings'
import Building from 'entity/building'
import Unit from 'entity/unit'
import Colony from 'entity/colony'

const create = () => {
  return {
    none: {
      progress: 0,
      cost: {},
      name: 'No construction',
    },
  }
}

const start = (colony, option) => {
  if (!option) {
    Colony.update.constructionTarget(colony, null)
    return
  }

  colony.construction[option.id] = option

  Colony.update.construction(colony)
  Colony.update.constructionTarget(colony, option.id)
}

const createOptionAdd = (colony, name) => {
  const id = `addBuilding-${name}`
  const option = {
    id,
    progress: colony.construction[id]?.progress ?? 0,
    display: Building.display(null, name),
    cost: Building.cost(null, name),
    construct: {
      action: 'addBuilding',
      building: name,
    }
  }

  return option
}


const createOptionIncrease = building => {
  const colony = building.colony
  const id = `increaseLevel-${building.name}`
  const option = {
    id,
    progress: colony.construction[id]?.progress ?? 0,
    display: Building.upgradeDisplay(building),
    cost: Building.upgradeCost(building),
    construct: {
      action: 'increaseLevel',
      building: building.name,
    }
  }

  return option
}

const createOptionUnit = (colony, unit, name) => {
  const id = `createUnit-${name}`
  const option = {
    id,
    progress: colony.construction[id]?.progress ?? 0,
    display: unit.name.default,
    cost: unit.construction.cost,
    construct: {
      action: 'createUnit',
      unit: name,
    }
  }

  return option
}



const options = colony => {
  const newBuildings = BuildingData.places
    .map(place => createOptionAdd(colony, place))

  const upgradeBuildings = colony.newBuildings
    .filter(
      building =>
          BuildingData[building.name].unlimitedLevels ||
          BuildingData[building.name].name.length > building.level + 1
    )
    .map(building => createOptionIncrease(building))


  const units = Object.entries(Units)
    .filter(
      ([name, unit]) =>
        unit.construction &&
        Object.entries(unit.construction.buildings).every(
          ([name, level]) => Building.level(colony, name) >= level
        )
    )
    .map(([name, unit]) => createOptionUnit(colony, unit, name))

  return {
    newBuildings,
    upgradeBuildings,
    units,
  }
}

const construct = (colony, option) => {
  const actions = {
    addBuilding: () => {
      Colony.addBuilding(colony, option.construct.building)
      const building = Building.get(colony, option.construct.building)
      Colony.update.newBuildings(colony)
      Events.trigger('notification', {
        type: 'construction',
        colony,
        building,
      })
      Message.colony.log(
        `${colony.name} has completed construction of a new ${Building.name(colony, option.construct.building)}.`
      )
    },
    increaseLevel: () => {
      const building = Building.get(colony, option.construct.building)
      building.level = Building.level(colony, option.construct.building) + 1
      Colony.update.newBuildings(colony)
      Events.trigger('notification', {
        type: 'construction',
        colony,
        building,
      })
      Message.colony.log(
        `${colony.name} has completed construction of ${Building.name(colony, option.construct.building)}.`
      )
    },
    createUnit: () => {
      const unit = Unit.create(option.action.unit, colony.mapCoordinates, colony.owner)
      Events.trigger('notification', {
        type: 'construction',
        colony,
        unit,
      })
      Message.colony.log(`${colony.name} has completed construction of ${Unit.name(unit)}.`)
    },
  }
  Util.execute(actions[option.construct.action])
  delete colony.construction[option.id]
  Colony.update.construction(colony)

  const { newBuildings, upgradeBuildings, units } = options(colony)
  // const newTarget = [...newBuildings, upgradeBuildings, ...units].find(option => option.target === construction.target)

  start(
    colony,
    null
  )
}

const save = construction => {
  return construction
}

const load = construction => {
  return construction
}

export default {
  create,
  start,
  load,
  save,
  construct,
  options,
}
