import Buildings from 'data/buildings'
import Units from 'data/units'

import Util from 'util/util'
import Events from 'util/events'
import Message from 'util/message'

import Building from 'entity/building'
import Unit from 'entity/unit'

const create = () => {
  return {
    none: {
      target: 'none',
      progress: 0,
      cost: {},
      name: 'No construction'
    }
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
    progress: option.progress()
  }

  Colony.update.construction(colony)
  Colony.update.constructionTarget(colony, option.target)
}

const options = colony => {
  const buildings = Buildings.places
    .filter(name => Buildings[name].unlimitedLevels
      || Buildings[name].name.length > colony.buildings[name].level + 1)
    .map(name => ({
      target: name,
      progress: () => colony.construction[name]
        ? colony.construction[name].progress
        : 0,
      name: () => Building.name(colony, name, Building.level(colony, name) + 1),
      cost: () => Building.cost(colony, name, Building.level(colony, name) + 1),
      construct: () => (['increaseLevel'])
    }))


  const units = Object.entries(Units)
    .filter(([name, unit]) => unit.construction
      && Object.entries(unit.construction.buildings).every(([name, level]) => colony.buildings[name].level >= level))
    .map(([name, unit]) => ({
      target: name,
      progress: () => colony.construction[name]
        ? colony.construction[name].progress
        : 0,
      name: () => unit.name.default,
      cost: () => unit.construction.cost,
      construct: () => (['createUnit'])
    }))

  return [...buildings, ...units]
}

const construct = (colony, construction) => {
  const actions = {
    increaseLevel: () => {
      colony.buildings[construction.target].level += 1
      Colony.update.buildings(colony)
      Events.trigger('notification', { type: 'construction', colony, building: colony.buildings[construction.target] })
      Message.send(`${colony.name} has completed construction of ${Building.name(colony, construction.target)}.`)
    },
    createUnit: () => {
      const unit = Unit.create(construction.target, colony.mapCoordinates, colony.owner)
      Events.trigger('notification', { type: 'construction', colony, unit })
      Message.send(`${colony.name} has completed construction of ${Unit.name(unit)}.`)
    }
  }
  Util.execute(construction.construct.map(actionName => actions[actionName]))

  delete colony.construction[construction.target]
  Colony.update.construction(colony)

  start(colony, options(colony).find(option => option.target === construction.target))
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
  construct,
  options
}