import Record from 'util/record'
import LA from 'util/la'
import Message from 'util/message'

import Plan from 'ai/plan'
import MoveUnit from 'ai/actions/moveUnit'
import Units from 'ai/resources/units'

const create = ({ owner, contact }) => {
  Message.log('establishing', contact.referenceId)
  const prev = Plan.cheapest(
    Record.getAll('unit')
      .filter(unit => unit.owner.referenceId === contact.referenceId)
      .filter(unit => unit.domain === 'land')
      // TODO: make a follow command
      .map(unit =>
        MoveUnit.create({
          owner,
          coords: LA.round(unit.mapCoordinates),
        })
      )
  )

  return (
    prev && {
      cost: prev.cost,
      commit: () => prev.commit().then(unit => unit && Units.unassign(unit)),
      cancel: prev.cancel,
    }
  )
}

export default {
  create,
}
