import Util from '../util/util'
import Unit from '../entity/unit'
import Colonist from '../entity/colonist'
import Colony from '../entity/colony'

export default colony => {
	const colonist = Util.choose(colony.colonists)
	const unit = colonist.unit
	Colonist.disband(colonist)
	Unit.disband(unit)
}