import Util from 'util/util'
import Message from 'util/message'
import Events from 'util/events'

import Buildings from 'entity/buildings'
import Colony from 'entity/colony'
import Unit from 'entity/unit'

// This whole file is a delegate to the correct building type
// Each building defines its own strategies
// Here is where we delegate

// TODO: Deprecate the (colony, name) access in favour of access through building directly
// This is necessary because we have multiple buildings of one type
const get = (colony, name) => colony?.newBuildings.find(building => building.name === name)
const level = (colony, name) => get(colony, name)?.level ?? 0
const display = (colony, name) => Buildings[name].display(get(colony, name))
const cost = (colony, name) => Buildings[name].cost()
const workspace = (colony, name) => Buildings[name].workspace(get(colony, name))


// These are okay
const load = building => {
  return Buildings[building.name].load(building)
}

const save = building => {
  return Buildings[building.name].save(building)
}

const upgradeDisplay = building => Buildings[building.name].upgradeDisplay(building)
const upgradeCost = building => Buildings[building.name].upgradeCost(building)
const canEmploy = (building, expert) => Buildings[building.name]?.canEmploy && Buildings[building.name]?.canEmploy(building, expert)


export default {
  get,
  save,
  load,
  level,
  canEmploy,
  name: display,
  display,
  upgradeDisplay,
  cost,
  upgradeCost,
  workspace,
}
