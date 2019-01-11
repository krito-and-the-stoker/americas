import Unit from '../entity/unit'
import Colony from '../entity/colony'

export default unit => {
	const colony = unit.colony
	Colony.remove.unit(unit)
	Unit.update.colony(unit, null)
}
