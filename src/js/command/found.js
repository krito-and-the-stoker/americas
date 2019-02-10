import Record from 'util/record'
import Events from 'util/events'
import Decorators from 'util/decorators'

import Colony from 'entity/colony'
import MapEntity from 'entity/map'
import Tile from 'entity/tile'
import Unit from 'entity/unit'

import BecomeColonist from 'interaction/becomeColonist'
import FindWork from 'interaction/findWork'
import EnterColony from 'interaction/enterColony'


const create = Decorators.ensureArguments(1, unit => {
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

		Events.trigger('found', { colony })

		return false
	}

	const save = () => ({
		module: 'Found',
		unit: Record.reference(unit)
	})

	return {
		init,
		save
	}
})

const load = data => create(Record.dereference(data.unit))

export default { create, load }