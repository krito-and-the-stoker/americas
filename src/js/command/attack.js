import MoveTo from 'command/moveTo'

import Unit from 'entity/unit'
import Colony from 'entity/colony'

const create = (attacker, { colony, unit }) => {
	const	defender = colony ? Colony.defender(colony) : unit
	Unit.add.hostile(attacker, defender)

	return MoveTo.create(attacker, colony.mapCoordinates)
}

const load = data => MoveTo.load(data)

export default {
	create,
	load
}