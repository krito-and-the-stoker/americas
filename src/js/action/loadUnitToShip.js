import Unit from 'entity/unit'
import Europe from 'entity/europe'
import LeaveColony from './leaveColony'
import Commander from 'command/commander'

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
