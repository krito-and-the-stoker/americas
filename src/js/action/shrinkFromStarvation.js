import Util from '../util/util'
import Unit from '../entity/unit'
import UnjoinColony from './unjoinColony'

export default colony => {
	const colonist = Util.choose(colony.colonists)
	const unit = colonist.unit
	UnjoinColony(colonist)
	Unit.disband(unit)
}