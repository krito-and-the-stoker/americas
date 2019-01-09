import Colony from '../entity/colony'
import UnitView from '../view/unit'
import Record from '../util/record'
import MapEntity from '../entity/map'
import Tile from '../entity/tile'

const create = unit => {
	const init = () => {
		if (!unit.properties.canFound) {
			return false
		}

		if (Tile.diagonalNeighbors(MapEntity.tile(unit.mapCoordinates)).some(neighbor => neighbor.colony)) {
			return false
		}

		UnitView.deactivate(unit)
		const colony = Colony.create(unit.mapCoordinates, unit)

		return false
	}

	const save = () => {
		unit: Record.reference(unit)
	}

	return {
		type: 'found',
		init,
		save
	}
}

const load = data => create(Record.dereference(data.unit))

export default { create, load }