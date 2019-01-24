import Util from 'util/util'
import Unit from 'entity/unit'
import Colonist from 'entity/colonist'
import Colony from 'entity/colony'
import Notification from 'view/ui/notification'

export default colony => {
	const colonist = Util.choose(colony.colonists)
	const unit = colonist.unit
	Notification.create({ type: 'died', colony, unit })
	Colonist.disband(colonist)
	Unit.disband(unit)
}