import 'test/min-setup'

import Colony from 'entity/colony'
import Unit from 'entity/unit'
import Colonist from 'entity/colonist'
import Production from 'entity/production'
import Owner from 'entity/owner'

test('production', () => {
  const colony = Colony.create({ x: 1, y: 1 }, Owner.player())
  const unit = Unit.create('settler', { x: 1, y: 1 }, Owner.player())
  const colonist = Colonist.create(unit)
  colony.buildings.blacksmiths.level = 1
  const production = Production.production(colony, 'blacksmiths', colonist)
  expect(production.amount).toBe(1)
  expect(production.good).toBe('tools')
})

test('consumption', () => {
  const consumption = Production.consumption('blacksmiths')
  expect(consumption.good).toBe('ore')
})
