import Unit from 'entity/unit'
import Europe from 'entity/europe'


export default passenger => {	
	Unit.unloadUnit(passenger.vehicle, passenger.vehicle.tile, passenger)
	Europe.add.unit(passenger)
}
