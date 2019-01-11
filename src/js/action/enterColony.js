import Unit from '../entity/unit'
import Colony from '../entity/colony'

export default (colony, unit) => {
	Colony.add.unit(colony, unit)
	Unit.update.colony(unit, colony)
	Unit.unloadAllUnits(unit)
}
