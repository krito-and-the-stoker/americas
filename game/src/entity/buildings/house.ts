import Triangles from 'data/triangles'

import Record from 'util/record'
import Binding from 'util/binding'

import Layout from 'entity/layout'
import Colony from 'entity/colony'

import { ColonyEntity } from 'entity/colony/types'
import { CleanupExec, Function1 } from 'signal-chain'
import { BuildingEntity } from 'view/colony/buildings'


const create = (colony: ColonyEntity, level = 1) => {
	const building: BuildingEntity = {
		name: 'house',
		level,
		colony,
		width: 1,
		height: 1,
		triangles: Triangles.house,
		placement: [],
		destroy: null,
	}

	building.destroy = initialize(building)

	Record.add('building', building)
	return building
}

const initialize = (building: BuildingEntity) => {
	if (!building.colony.name) {
		console.warn('Skipped dangling building', building, building.colony)
		return
	}

	return [
		listen.level(building, () => {
			if (building.placement.length === 0) {
				const colony = building.colony

				building.placement = [
					Layout.placeBuilding(colony, building),
					Layout.placeBuilding(colony, building),
					Layout.placeBuilding(colony, building),
				].filter(x => !!x)
				Colony.update.newBuildings(colony)
			}

			return () => {
				Layout.removeBuilding(building.colony, building)
				building.placement = []
			}
		})
	]
}

const save = (building: BuildingEntity) => ({
	name: building.name,
	level: building.level,
	width: building.width,
	height: building.height,
	triangles: building.triangles,
	placement: building.placement,
	colony: Record.reference(building.colony)
})

const load = (building: BuildingEntity) => {
	Record.dereferenceLazy(building.colony, (entity: ColonyEntity) => {
		building.colony = entity
	})

	Record.entitiesLoaded(() => initialize(building))

	return building
}

const isInteractive = () => false
const display = (building: BuildingEntity) => {
	if (building?.level === 0) {
		return 'Camp'
	}

	return 'Houses'
}
const upgradeDisplay = () => 'Houses'
const cost = () => ({
	wood: 25,
	tools: 5,
})
const upgradeCost = () => ({
	wood: 25,
	tools: 5,
})
const workspace = () => 0

const update = {
	level: (building: BuildingEntity, value: number) => Binding.update(building, 'level', value)
}

const listen = {
	level: (building: BuildingEntity, fn: Function1<number, CleanupExec>) => Binding.listen(building, 'level', fn)
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