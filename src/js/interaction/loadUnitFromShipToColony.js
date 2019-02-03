import Unit from 'entity/unit'

import EnterColony from 'interaction/enterColony'


export default (colony, passenger) => {	
	Unit.unloadUnit(passenger.vehicle, passenger)
	EnterColony(colony, passenger)
}
