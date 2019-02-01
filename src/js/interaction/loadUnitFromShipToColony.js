import Unit from 'entity/unit'
import EnterColony from './enterColony'

export default (colony, passenger) => {	
	Unit.unloadUnit(passenger.vehicle, passenger)
	EnterColony(colony, passenger)
}
