import Unit from '../entity/unit'
import Colony from '../entity/colony'

export default (colony, unit) => {
	Colony.add.unit(colony, unit)
	unit.colony = colony
	Unit.unloadAllUnits(unit)
}
