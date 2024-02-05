import 'test/min-setup'

import Time from 'timeline/time'

import Unit from 'entity/unit'
import Owner from 'entity/owner'

import TradeRoute from 'command/tradeRoute'
import Commander from 'command/commander'

test('unload passengers', () => {
  const vessel = Unit.create('caravel', { x: 1, y: 1 }, Owner.player())
  const passenger = Unit.create('settler', { x: 1, y: 1 }, Owner.player())
  Unit.loadUnit(vessel, passenger)
  expect(vessel.passengers.length).toBe(1)
  Commander.scheduleInstead(vessel.commander, TradeRoute.create({ unit: vessel }))
  Time.advance(16)
  Time.advance(500)
  Time.advance(500)
  expect(vessel.passengers.length).toBe(0)
})
