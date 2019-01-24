import Unit from 'entity/unit'
import Europe from 'entity/europe'
import EnterColony from './enterColony'

export default passenger => {	
	Unit.unloadUnit(passenger.vehicle, passenger)
	Europe.add.unit(passenger)
}
