import Events from 'util/events'

import Settlement from 'entity/settlement'
import Unit from 'entity/unit'

export default (settlement, unit) => {
  const state = settlement.owner.ai.state
  state.relations[unit.owner.referenceId].trust -= 0.1
  state.relations[unit.owner.referenceId].militancy += 0.2
  state.relations[unit.owner.referenceId].militancy *= 0.9

  Unit.update.radius(unit, 0)

  if (Math.random() * settlement.population < 1) {
    Settlement.disband(settlement)

    const treasure = Unit.create('treasure', settlement.mapCoordinates)
    treasure.treasure = Math.round(
      settlement.tribe.civilizationLevel *
        settlement.tribe.civilizationLevel *
        settlement.tribe.civilizationLevel *
        (10 + 40 * Math.random())
    )
    Events.trigger('notification', {
      type: 'destroyed',
      settlement,
      treasure,
    })
    state.relations[unit.owner.referenceId].trust -= 0.5
    state.relations[unit.owner.referenceId].militancy += 0.5
  } else {
    settlement.population -= 1
    Events.trigger('notification', { type: 'decimated', settlement })
  }
}
