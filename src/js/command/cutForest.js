import Time from '../timeline/time'
import MapEntity from '../entity/map'
import Tile from '../entity/tile'
import UnitView from '../view/unit'
import Record from '../util/record'

const create = (unit, eta) => {
	let aborted = false
	const init = currentTime => {
		const tile = MapEntity.tile(unit.mapCoordinates)
		if (eta) {
			UnitView.markOccupied(unit)
		}
		if (!eta && unit.properties.canTerraform && tile.forest) {
			eta = currentTime + Time.CUT_FOREST
			return true
		}

		aborted = true
		return false
	}

	const update = currentTime => currentTime < eta
	const finished = () => {
		if (!aborted) {		
			Tile.clearForest(MapEntity.tile(unit.mapCoordinates))
			UnitView.markFree(unit)
		}
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