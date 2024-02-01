import 'test/min-setup'
import Record from 'util/record'

import Unit from 'entity/unit'
import Owner from 'entity/owner'
import Tile from 'entity/tile'


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
	const passenger1 = Unit.create('settler', { x: 0, y: 0 }, Owner.player())
	const passenger2 = Unit.create('pioneer', { x: 0, y: 0 }, Owner.player())
	Unit.loadUnit(transport, passenger1)
	Unit.loadUnit(transport, passenger2)
	expect(transport.passengers[0]).toBe(passenger1)
	expect(transport.passengers[1]).toBe(passenger2)
	Unit.unloadUnit(transport, passenger1.tile, passenger1)
	expect(transport.passengers[0]).toBe(passenger2)
	Unit.unloadUnit(transport, passenger2.tile)
	expect(transport.passengers.length).toBe(0)
})