import Unit from '../entity/unit'
import Colony from '../entity/colony'

export default unit => {
	const colony = unit.colony
	Colony.remove.unit(colony, unit)
	unit.colony = null
}
