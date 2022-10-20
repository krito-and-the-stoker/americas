import Unit from 'entity/unit'

import EnterColony from 'interaction/enterColony'


export default (colony, passenger) => {	
	Unit.unloadUnit(passenger.vehicle, colony.tile, passenger)
	EnterColony(colony, passenger)
}
