import Unit from 'entity/unit'
import Colony from 'entity/colony'

import EnterColony from 'interaction/enterColony'

export default (colony, passenger) => {
  Unit.unloadUnit(passenger.vehicle, Colony.tile(colony), passenger)
  EnterColony(colony, passenger)
}
