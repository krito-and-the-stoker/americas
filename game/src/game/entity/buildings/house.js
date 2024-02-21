import { default as BuildingFactory, positions } from './factory'
import Util from 'util/util'
import Produce from 'task/colony/produce'
import Time from 'timeline/time'


const create = colony => {
  const building = {
    name: 'house',
    level: 1,
    colony,
    width: 1,
    position: Util.choose(positions),
  }

  building.destroy = initialize(building)

  return building
}

const initialize = building => {
	console.log('new house in', building.colony.name)
	return [
		Time.schedule(Produce.create(building.colony, 'housing', 1))
	]
}

const display = () => 'house'
const upgradeDisplay = () => 'house'
const cost = () => ({
	wood: '25',
	tools: '5'
})
const upgradeCost = () => ({
	wood: '25',
	tools: '5'
})
const workspace = building => 0


export default {
	...BuildingFactory,
  create,
  initialize,
  display,
  upgradeDisplay,
  cost,
  upgradeCost,
  workspace,
}