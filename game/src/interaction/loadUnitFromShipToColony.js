import Signal from 'util/signal-ts'
import Unit from 'entity/unit'
import Colony from 'entity/colony'

import EnterColony from 'interaction/enterColony'

export default (colony, passenger) => {
  const tile = Signal.evaluate(Signal.emit(colony), Colony.chain.tile)
  Unit.unloadUnit(passenger.vehicle, tile, passenger)
  EnterColony(colony, passenger)
}
