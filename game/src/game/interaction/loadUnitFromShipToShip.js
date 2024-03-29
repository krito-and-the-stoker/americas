import Unit from 'entity/unit'

export default (ship, passenger) => {
  if (ship.domain === 'sea' && Unit.hasCapacity(ship)) {
    Unit.unloadUnit(passenger.vehicle, passenger.vehicle.tile, passenger)
    Unit.loadUnit(ship, passenger)
  }
}
