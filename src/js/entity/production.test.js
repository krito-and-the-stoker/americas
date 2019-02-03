import 'test/setup'

import Colony from 'entity/colony'
import Unit from 'entity/unit'
import Colonist from 'entity/colonist'
import Production from 'entity/production'
import Owner from 'entity/owner'


test('production', () => {
	const colony = Colony.create({ x: 74, y: 36 }, Owner.player())
	const unit = Unit.create('settler', { x: 74, y: 36 }, Owner.player())
	const colonist = Colonist.create(unit)
	const production = Production.production(colony, 'blacksmiths', colonist)
	expect(production.amount).toBe(3)
	expect(production.good).toBe('tools')
})

test('consumption', () => {
	const consumption = Production.consumption('blacksmiths')
	expect(consumption.good).toBe('ore')
})