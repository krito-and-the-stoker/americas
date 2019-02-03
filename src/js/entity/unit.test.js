import americaSmallMap from 'data/america-small'

import polyfills from 'util/polyfills'
import Record from 'util/record'

import Unit from 'entity/unit'
import Owner from 'entity/owner'
import MapEntity from 'entity/map'


beforeAll(() => {
	MapEntity.create({ data: americaSmallMap })
	Owner.initialize()
})


test('create/disband', () => {
	const unit = Unit.create('caravel', { x: 0, y: 0 }, Owner.player())
	expect(unit).toBeDefined()
	Unit.disband(unit)
	expect(Record.getAll('unit').length).toBe(0)
})

test('strength', () => {
	const unit = Unit.create('dragoon', { x: 0, y: 0 }, Owner.player())
	expect(Unit.strength(unit)).toBe(3)
})

test('load/unload', () => {
	const transport = Unit.create('caravel', { x: 0, y: 0 }, Owner.player())
	const passenger = Unit.create('settler', { x: 0, y: 0 }, Owner.player())
	Unit.loadUnit(transport, passenger)
	expect(transport.passengers[0]).toBe(passenger)
	Unit.unloadUnit(transport, passenger)
	expect(transport.passengers.length).toBe(0)
})