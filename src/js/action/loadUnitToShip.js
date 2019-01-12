import Unit from '../entity/unit'
import Europe from '../entity/europe'
import LeaveColony from './leaveColony'

export default (ship, unit) => {	
	if (Unit.loadUnit(ship, unit)) {
		if (Europe.has.unit(unit)) {
			Europe.remove.unit(unit)
		}
		if (unit.colony) {
			LeaveColony(unit)
		}
	}
}
