import Unit from 'entity/unit'
import Europe from 'entity/europe'

import Commander from 'command/commander'

import LeaveColony from 'interaction/leaveColony'


export default (ship, unit) => {	
	if (!unit.treasure || ship.properties.canTransportTreasure && Commander.isIdle(ship.commander)) {	
		if (Unit.loadUnit(ship, unit)) {
			if (Europe.has.unit(unit)) {
				Europe.remove.unit(unit)
			}
			if (unit.colony) {
				LeaveColony(unit)
			}
		}
	}
}
