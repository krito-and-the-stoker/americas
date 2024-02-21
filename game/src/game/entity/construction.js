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
      target: 'none',
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

  colony.construction[option.target] = {
    target: option.target,
    cost: option.cost(),
    name: option.name(),
    construct: option.construct(),
    progress: option.progress(),
  }

  Colony.update.construction(colony)
  Colony.update.constructionTarget(colony, option.target)
}

const options = colony => {
  const newBuildings = BuildingData.places
    .map(name => ({
      target: name,
      progress: () => colony.construction[name]?.progress ?? 0,
      name: () => Building.name(colony, name),
      cost: () => Building.cost(colony, name),
      construct: () => ['addBuilding'],
    }))

  const upgradeBuildings = BuildingData.places
    .filter(
      name =>
        Building.level(colony, name) > 0 && (
          BuildingData[name].unlimitedLevels ||
          BuildingData[name].name.length > Building.level(colony, name) + 1
        )
    )
    .map(name => ({
      target: name,
      progress: () => colony.construction[name]?.progress ?? 0,
      name: () => Building.upgradeName(colony, name),
      cost: () => Building.upgradeCost(colony, name),
      construct: () => ['increaseLevel'],
    }))

  const units = Object.entries(Units)
    .filter(
      ([name, unit]) =>
        unit.construction &&
        Object.entries(unit.construction.buildings).every(
          ([name, level]) => Building.level(colony, name) >= level
        )
    )
    .map(([name, unit]) => ({
      target: name,
      progress: () => colony.construction[name]?.progress ?? 0,
      name: () => unit.name.default,
      cost: () => unit.construction.cost,
      construct: () => ['createUnit'],
    }))

  return {
    newBuildings,
    upgradeBuildings,
    units,
  }
}

const construct = (colony, construction) => {
  const actions = {
    addBuilding: () => {
      Colony.addBuilding(colony, construction.target)
      const building = Building.get(colony, construction.target)
      colony.construction[construction.target] = null
      Colony.update.newBuildings(colony)
      Events.trigger('notification', {
        type: 'construction',
        colony,
        building,
      })
      Message.colony.log(
        `${colony.name} has completed construction of a new ${Building.name(colony, construction.target)}.`
      )
    },
    increaseLevel: () => {
      const building = Building.get(colony, construction.target)
      building.level = Building.level(colony, construction.target) + 1
      colony.construction[construction.target] = null
      Colony.update.newBuildings(colony)
      Events.trigger('notification', {
        type: 'construction',
        colony,
        building,
      })
      Message.colony.log(
        `${colony.name} has completed construction of ${Building.name(colony, construction.target)}.`
      )
    },
    createUnit: () => {
      const unit = Unit.create(construction.target, colony.mapCoordinates, colony.owner)
      Events.trigger('notification', {
        type: 'construction',
        colony,
        unit,
      })
      Message.colony.log(`${colony.name} has completed construction of ${Unit.name(unit)}.`)
    },
  }
  Util.execute(construction.construct.map(actionName => actions[actionName]))

  delete colony.construction[construction.target]
  Colony.update.construction(colony)

  const { newBuildings, upgradeBuildings, units } = options(colony)
  const newTarget = [...newBuildings, upgradeBuildings, ...units].find(option => option.target === construction.target)

  start(
    colony,
    newTarget
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
