import Triangles from 'data/triangles'
import BuildingFactory from './factory'

import Util from 'util/util'
import Record from 'util/record'
import Time from 'timeline/time'

import Layout from 'entity/layout'

import Produce from 'task/colony/produce'


const create = (colony, level) => {
  const building = {
    name: 'house',
    level,
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

  Record.add('building', building)
  return building
}

const initialize = building => {
	return [
		Time.schedule(Produce.create(building.colony, 'housing', building.level))
	]
}

const save = building => ({
  ...building,
  colony: Record.reference(building.colony)
})

const load = building => {
  Record.dereferenceLazy(building.colony, entity => {
    building.colony = entity
  })

  Record.entitiesLoaded(() => initialize(building))

  return building
}

const isInteractive = () => false
const display = () => 'Houses'
const upgradeDisplay = () => 'House'
const cost = () => ({
	wood: 25,
	tools: 5
})
const upgradeCost = () => ({
	wood: 25,
	tools: 5
})
const workspace = () => 0


export default {
	load,
  save,
  create,
  isInteractive,
  initialize,
  display,
  upgradeDisplay,
  cost,
  upgradeCost,
  workspace,
}