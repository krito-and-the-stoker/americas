import Buildings from 'data/buildings.json'

import Util from 'util/util'
import Message from 'util/message'
import Events from 'util/events'

import Colony from 'entity/colony'
import Unit from 'entity/unit'

const create = () => {
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

  const buildings = Buildings.places.map(name => ({
    name,
    level: 0,
    width: Buildings[name].width,
  }))
  if (
    buildings.filter(building => building.width === 2).length <
    2 * buildings.filter(building => building.width === 2)
  ) {
    Message.warn(
      'There might not be enough slots for double width buildings left',
      buildings,
      positions
    )
  }
  buildings
    .filter(building => building.width === 2)
    .forEach(building => {
      building.position = Util.choose(positions.filter(pos => !pos.taken && pos.width >= 2))
      // TODO: This works suprisingly well
      if (building.position) {
        building.position.taken = true
        const left = positions.find(
          pos => pos.x === building.position.x - 1 && pos.y === building.position.y
        )
        if (left) {
          left.width = 1
        }
        const right = positions.find(
          pos => pos.x === building.position.x + 1 && pos.y === building.position.y
        )
        if (right) {
          right.taken = true
        }
      }
    })
  if (
    buildings.filter(building => building.width === 1).length >
    positions.filter(pos => !pos.taken).length
  ) {
    Message.warn(
      'There is not enough slots left for buildings with size 1',
      buildings,
      positions
    )
  }
  buildings
    .filter(building => building.width === 1)
    .forEach(building => {
      building.position = Util.choose(positions.filter(pos => !pos.taken))
      building.position.taken = true
    })

  return Util.makeObject(buildings.map(building => [building.name, building]))
}

const level = (colony, name) => colony.buildings[name].level
const name = (colony, name, requestedLevel = null) => {
  const buildingLevel =
    !requestedLevel && requestedLevel !== 0 ? level(colony, name) : requestedLevel

  return (
    Buildings[name].name[buildingLevel] ||
    Buildings[name].name[Buildings[name].name.length - 1]
  )
}
const cost = (colony, name, requestedLevel = null) => {
  const buildingLevel =
    !requestedLevel && requestedLevel !== 0 ? level(colony, name) : requestedLevel

  return (
    Buildings[name].cost[buildingLevel] ||
    Buildings[name].cost[Buildings[name].cost.length - 1]
  )
}

const workspace = (colony, name) =>
  (Buildings[name].workspace.length
    ? Buildings[name].workspace[level(colony, name)]
    : Buildings[name].workspace) || 0

export default {
  create,
  level,
  name,
  cost,
  workspace,
}
