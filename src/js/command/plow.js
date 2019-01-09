import Time from '../timeline/time'
import MapEntity from '../entity/map'
import Tile from '../entity/tile'
import UnitView from '../view/unit'
import Record from '../util/record'
import Binding from '../util/binding'

const create = (unit, eta) => {
	let aborted = false
	const init = currentTime => {
		const tile = MapEntity.tile(unit.mapCoordinates)
		if (!eta && unit.properties.canTerraform && !tile.forest) {
			eta = currentTime + Time.PLOW
		}

		if (eta) {
			UnitView.markOccupied(unit)
			return true
		}

		aborted = true
		return false
	}

	const update = currentTime => currentTime < eta
	const finished = () => {
		if (!aborted) {
			unit.equipment.tools -= 20
			Binding.update(unit, 'equipment')	
			Tile.plow(MapEntity.tile(unit.mapCoordinates))
			UnitView.markFree(unit)
		}
	}

	const save = () => ({
		type: 'plow',
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