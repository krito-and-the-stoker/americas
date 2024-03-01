import Triangles from 'data/triangles'
import BuildingFactory from './factory'

import Time from 'timeline/time'

import Util from 'util/util'
import Record from 'util/record'
import Binding from 'util/binding'

import Layout from 'entity/layout'
import Colony from 'entity/colony'

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

  building.placement = []
  building.destroy = initialize(building)

  Record.add('building', building)
  return building
}

const initialize = building => {
	return [
    listen.level(building, level => [
		  level > 0 && Time.schedule(Produce.create(building.colony, 'housing', building.level)),
      level => {
        const colony = building.colony
        Layout.removeBuilding(colony, building)
        building.placement = [
          Layout.placeBuilding(colony, building),
          Layout.placeBuilding(colony, building),
          Layout.placeBuilding(colony, building),
        ]
        Colony.update.newBuildings(colony)
      }
    ])
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
const display = building => {
  if (building?.level === 0) {
    return 'Camp'
  }

  return 'Houses'
}
const upgradeDisplay = () => 'Houses'
const cost = () => ({
	wood: 25,
	tools: 5
})
const upgradeCost = () => ({
	wood: 25,
	tools: 5
})
const workspace = () => 0

const update = {
  level: (building, value) => Binding.update(building, 'level', value)
}

const listen = {
  level: (building, fn) => Binding.listen(building, 'level', fn)
}

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
  update,
}