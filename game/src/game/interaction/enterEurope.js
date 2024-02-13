import Message from 'util/message'

import Treasure from 'entity/treasure'
import Unit from 'entity/unit'
import Europe from 'entity/europe'

export default unit => {
  Europe.add.unit(unit)
  Unit.unloadAllUnits(unit)
  if (unit.treasure) {
    Treasure.gain(unit.treasure)
    Message.europe.log(
      `A treasure worth ${unit.treasure} has arrived in Europe. The king is very pleased.`
    )
    Unit.disband(unit)
  }
}
