import Unit from 'entity/unit'
import Europe from 'entity/europe'


export default passenger => {	
	Unit.unloadUnit(passenger.vehicle, passenger)
	Europe.add.unit(passenger)
}
