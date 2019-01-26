import Colony from 'entity/colony'
import Record from 'util/record'
import MapEntity from 'entity/map'
import Tile from 'entity/tile'
import Colonist from 'entity/colonist'
import BecomeColonist from 'action/becomeColonist'
import FindWork from 'action/findWork'
import EnterColony from 'action/enterColony'
import Unit from 'entity/unit'

const create = unit => {
	const init = () => {
		if (!unit.properties.canFound) {
			return false
		}

		const tile = MapEntity.tile(unit.mapCoordinates)
		if (tile.settlement) {
			return false
		}
		if (Tile.radius(tile).some(neighbor => neighbor.colony)) {
			return false
		}

		Tile.constructRoad(tile)
		const colony = Colony.create(unit.mapCoordinates, unit.owner)
		Unit.at(unit.mapCoordinates).forEach(unit => {
			EnterColony(colony, unit)
		})
		BecomeColonist(colony, unit)
		FindWork(unit.colonist)

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