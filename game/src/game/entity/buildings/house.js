import Triangles from 'data/triangles'
import { default as BuildingFactory, positions } from './factory'

import Util from 'util/util'
import Time from 'timeline/time'

import Layout from 'entity/layout'

import Produce from 'task/colony/produce'


const create = colony => {
  const building = {
    name: 'house',
    level: 1,
    colony,
    width: 1,
    height: 1,
    triangles: Triangles.house,
  }

  building.placement = [
    Layout.placeBuilding(colony, building),
    Layout.placeBuilding(colony, building),
    Layout.placeBuilding(colony, building),
  ]
  building.destroy = initialize(building)

  return building
}

const initialize = building => {
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