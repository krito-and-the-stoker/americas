import Buildings from 'data/buildings'
import Units from 'data/units'

import Building from 'entity/building'
import Unit from 'entity/unit'

const create = () => {
  return {
    none: {
      target: 'none',
      progress: 0
    }
  }
}

const start = (colony, target) => {
  if (!colony.construction[target]) {
    colony.construction[target] = {
      target,
      progress: 0
    }
  }

  Colony.update.construction(colony)
  Colony.update.constructionTarget(colony, target)
}

const options = colony => {
  const buildings = Buildings.places
    .filter(name => Buildings[name].unlimitedLevels
      || Buildings[name].name.length > colony.buildings[name].level + 1)
    .map(name => ({
      target: name,
      name: () => Building.name(colony, name, Building.level(colony, name) + 1),
      cost: () => Building.cost(colony, name, Building.level(colony, name) + 1),
      action: () => {
        const buildings = colony.buildings
        buildings[name].level += 1
        Colony.update.buildings(colony)
        Events.trigger('notification', { type: 'construction', colony, building: colony.buildings[name] })
        Message.send(`${colony.name} has completed construction of ${name(colony, name, colony.buildings[name].level + 1)}.`)
      }
    }))


  const units = Object.entries(Units)
    .filter(([name, unit]) => unit.construction
      && Object.entries(unit.construction.buildings).every(([name, level]) => colony.buildings[name] >= level))
    .map(([name, unit]) => ({
      target: name,
      name: () => unit.name.default,
      cost: () => unit.construction.cost,
      action: () => {
        const unit = Unit.create(name, colony.mapCoordinates, colony.owner)
        Events.trigger('notification', { type: 'construction', colony, unit })
        Message.send(`${colony.name} has completed construction of ${Unit.name(unit)}.`)
      }
    }))

  // TODO: find a more appropriate place for this special handling
  const warehouse = buildings.find(building => building.target === 'warehouse')
  if (warehouse) {
    warehouse.action = [
      warehouse.action,
      () => {
        colony.capacity += 100
      }
    ]
  }

  return [...buildings, ...units]
}

const construct = (colony, target) => {
  Util.execute(colony.construction[target].action)

  colony.construction[target].progress = 0
  Colony.update.construction(colony)

  if (!constructionOptions().find(option => option.target === target)) {
    Colony.update.constructionTarget(colony, null)
  }
}

const save = (construction) => {
  return construction
}

const load = (construction) => {
  return construction
}

export default {
  create,
  start,
  load,
  save,
  options
}