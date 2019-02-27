import Events from 'util/events'

import Settlement from 'entity/settlement'
import Unit from 'entity/unit'

export default (settlement, unit) => {
	const state = settlement.owner.ai.state
	state.relations[unit.owner.referenceId].trust -= 1
	state.relations[unit.owner.referenceId].trust *= 0.5
	state.relations[unit.owner.referenceId].militancy += 1
	state.relations[unit.owner.referenceId].militancy *= 0.9

	if (Math.random() * settlement.population < 1) {
		Settlement.disband(settlement)

		const treasure = Unit.create('treasure', settlement.mapCoordinates)
		treasure.treasure = Math.round(50 + Math.random() * 450)
		Events.trigger('notification', { type: 'destroyed', settlement, treasure })
	} else {
		settlement.population -= 1
		Events.trigger('notification', { type: 'decimated', settlement })
	}
}