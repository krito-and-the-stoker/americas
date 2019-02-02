import Unit from 'entity/unit'
import Colony from 'entity/colony'

import MoveTo from 'command/moveTo'


const predictCoordinates = unit => {
	const from = unit.tile.mapCoordinates
	const to = unit.mapCoordinates
	return {
		x: from.x + Math.ceil(to.x - from.x),
		y: from.y + Math.ceil(to.y - from.y)
	}
}

const create = (attacker, { colony, unit }) => {
	const	defender = colony ? Colony.defender(colony) : unit
	Unit.add.hostile(attacker, defender)


	return MoveTo.create(attacker, predictCoordinates(defender))
}

const load = data => MoveTo.load(data)

export default {
	create,
	load
}