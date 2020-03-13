import Util from 'util/util'

import Units from 'ai/resources/units'

const create = ({ owner, coords }) => {
	const unit = Util.min(Units.free(owner), unit => Util.distance(unit.mapCoordinates, coords))

	if (unit) {
		Units.assign(unit)

		return {
			commit: () => {
				return unit
			},
			dismiss: () => Units.unassign(unit),
			cost: 0,
			coords: unit.mapCoordinates
		}
	}

	return null
}



export default {
	create,
}