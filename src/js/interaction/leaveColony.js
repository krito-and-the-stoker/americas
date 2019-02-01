import Unit from 'entity/unit'
import Colony from 'entity/colony'

export default unit => {
	Colony.remove.unit(unit)
	Unit.update.colony(unit, null)
}
