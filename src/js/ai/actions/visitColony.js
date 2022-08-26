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
	const prev = MoveUnit.create({ owner: tribe.owner, coords: colony.mapCoordinates })
	let cancel = [prev.cancel]

	return prev ? {
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
		}
	} : null
}


const commit = (tribe, state, colony) => {
	const relation = state.relations[colony.owner.referenceId]
	const good = Util.choose(['food', 'cotton', 'furs', 'tobacco', 'sugar', 'coats', 'cloth'])
	const amount = Math.ceil(5 + 15 * Math.random() + 20 * relation.trust)

	relation.colonies[colony.referenceId].visited = Time.now()
	Events.trigger('dialog', {
		type: 'natives',
		image: tribe.image,
		text: `You have made quite some progress with your village called **${colony.name}**. The *${tribe.name}* want to help you and gift you these **${amount}**<good>${good}</good>.<options/>`,
		pause: true,
		options: [{
			text: 'Thank you.',
			default: true,
			action: () => {
				Storage.update(colony.storage, { good, amount })
			}
		}]
	})
}


export default {
	create
}