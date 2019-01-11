import Colony from '../entity/colony'
import Record from '../util/record'
import MapEntity from '../entity/map'
import Tile from '../entity/tile'
import Colonist from '../entity/colonist'
import BecomeColonist from '../action/becomeColonist'

const create = unit => {
	const init = () => {
		if (!unit.properties.canFound) {
			return false
		}

		if (Tile.diagonalNeighbors(MapEntity.tile(unit.mapCoordinates)).some(neighbor => neighbor.colony)) {
			return false
		}

		const colony = Colony.create(unit.mapCoordinates)
		BecomeColonist(colony, unit)

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