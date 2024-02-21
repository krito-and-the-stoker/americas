import Util from 'util/util'
import Message from 'util/message'
import Events from 'util/events'

import Buildings from 'entity/buildings'
import Colony from 'entity/colony'
import Unit from 'entity/unit'

const get = (colony, name) => colony.newBuildings.find(building => building.name === name)
const level = (colony, name) => get(colony, name)?.level ?? 0
const display = (colony, name) => Buildings[name].display(get(colony, name))
const upgradeName = (colony, name) => get(colony, name)
  ? Buildings[name].upgradeDisplay(get(colony, name))
  : Buildings[name].display()
const cost = (colony, name) => Buildings[name].cost()
const upgradeCost = (colony, name) => Buildings[name].upgradeCost(get(colony, name))
const workspace = (colony, name) => Buildings[name].workspace(get(colony, name))


export default {
  get,
  level,
  name: display,
  upgradeName,
  cost,
  upgradeCost,
  workspace,
}
