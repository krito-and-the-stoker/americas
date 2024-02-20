import BuildingData from 'data/buildings'

import Util from 'util/util'
import Message from 'util/message'
import Events from 'util/events'

import Buildings from 'entity/buildings'
import Colony from 'entity/colony'
import Unit from 'entity/unit'

const get = (colony, name) => colony.newBuildings.find(building => building.name === name)
const level = (colony, name) => get(colony, name)?.level ?? 0
const name = (colony, name, requestedLevel = null) => {
  const buildingLevel =
    !requestedLevel && requestedLevel !== 0 ? level(colony, name) : requestedLevel

  return (
    BuildingData[name].name[buildingLevel] ||
    BuildingData[name].name[BuildingData[name].name.length - 1]
  )
}
const upgradeName = (colony, nn) => name(colony, nn, level(colony, name) + 1)
const cost = (colony, name, requestedLevel = null) => {
  const buildingLevel =
    !requestedLevel && requestedLevel !== 0 ? level(colony, name) : requestedLevel

  return (
    BuildingData[name].cost[buildingLevel] ||
    BuildingData[name].cost[BuildingData[name].cost.length - 1]
  )
}
const upgradeCost = (colony, name) => cost(colony, name, level(colony, name) + 1)

const workspace = (colony, name) =>
  (BuildingData[name].workspace.length
    ? BuildingData[name].workspace[level(colony, name)]
    : BuildingData[name].workspace) || 0

export default {
  get,
  level,
  name,
  upgradeName,
  cost,
  upgradeCost,
  workspace,
}
