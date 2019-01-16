import Unit from '../entity/unit'
import Europe from '../entity/europe'
import EnterColony from './enterColony'

export default (ship, passenger) => {
	if (Unit.hasCapacity(ship)) {
		Unit.unloadUnit(passenger.vehicle, passenger)
		Unit.loadUnit(ship, passenger)		
	}
}
