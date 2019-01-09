import Time from '../timeline/time'
import MapEntity from '../entity/map'
import Tile from '../entity/tile'
import UnitView from '../view/unit'

const create = (unit, eta) => {
	const init = currentTime => {
		const tile = MapEntity.tile(unit.mapCoordinates)
		if (!eta && unit.canTerraform && tile.forest) {
			eta = currentTime + Time.CUT_FOREST
			UnitView.markOccupied(unit)
			return true
		}

		return false
	}

	const update = currentTime => currentTime < eta
	const finished = () => {
		Tile.clearForest(MapEntity.tile(unit.mapCoordinates))
		UnitView.markFree(unit)
	}

	const save = () => ({
		type: 'cutForest',
		unit: Record.reference(unit),
		eta
	})

	return {
		init,
		update,
		finished,
		save
	}
}

const load = data => {
	const unit = Record.dereference(data.unit)
	return create(unit, data.eta)
}

export default {
	create,
	load
}