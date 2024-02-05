import Util from 'util/util'
import Events from 'util/events'

import Unit from 'entity/unit'
import Colonist from 'entity/colonist'

export default colony => {
  const colonist = Util.choose(colony.colonists)
  const unit = colonist.unit
  Events.trigger('notification', { type: 'died', colony, unit })
  Colonist.disband(colonist)
  Unit.disband(unit)
}
