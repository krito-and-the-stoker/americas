import Util from 'util/util'
import Events from 'util/events'
import Message from 'util/message'

import Time from 'timeline/time'

import Storage from 'entity/storage'

import MoveUnit from 'ai/actions/moveUnit'
import Units from 'ai/resources/units'
import Disband from 'ai/actions/disband'

const create = ({ tribe, state, colony }) => {
  Message.log('visiting', colony.name)
  const prev = MoveUnit.create({
    owner: tribe.owner,
    coords: colony.mapCoordinates,
  })
  let cancel = [prev.cancel]

  return prev
    ? {
        cancel: () => Util.execute(cancel),
        commit: () => {
          return prev.commit().then(unit => {
            Units.unassign(unit)
            commit(tribe, state, colony)

            if (!unit.disbanded) {
              const disbandAction = Disband.create(unit)
              cancel.push(disbandAction.commit())
            }
          })
        },
      }
    : null
}

const commit = (tribe, state, colony) => {
  const relation = state.relations[colony.owner.referenceId]
  const good = Util.choose(['food', 'cotton', 'furs', 'tobacco', 'sugar', 'coats', 'cloth'])
  const amount = Math.ceil(5 + 15 * Math.random() + 20 * relation.trust)

  relation.colonies[colony.referenceId].visited = Time.now()
  Events.trigger('ui-dialog', {
    name: 'natives.visit_colony',
    context: {
      tribe,
      relation,
      good,
      amount,
      colony,
      take: () => {
        Storage.update(colony.storage, { good, amount })
      }
    }
  })
}

export default {
  create,
}
