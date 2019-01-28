import MoveTo from 'command/moveTo'

import Unit from 'entity/unit'
import Colony from 'entity/colony'

const create = (unit, { colony }) => {
	let defender
	// Colony.listen.units(colony, units => {
		defender = Colony.defender(colony)
		Unit.add.hostile(unit, defender)
	// 	return () => {
	// 		Unit.remove.hostile(unit, defender)
	// 	}
	// })

	return MoveTo.create(unit, colony.mapCoordinates)
}

const load = data => MoveTo.load(data)

export default {
	create,
	load
}