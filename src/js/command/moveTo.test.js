import 'test/min-setup'


import Util from 'util/util'
import Record from 'util/record'

import Time from 'timeline/time'

import Unit from 'entity/unit'
import Commander from 'command/commander'
import MoveTo from 'command/moveTo'


// const ship = () => Unit.create('caravel', { x: 0, y: 5 })
const advance = (n = 1) => Util.range(n).forEach(() => Time.advance(500))

const soldier = () => Unit.create('soldier', { x: 1, y: 2 })
const place = () => ({ x: 2, y: 4 })

test('create & schedule', () => {
	const unit = soldier()
	Commander.scheduleBehind(unit.commander, MoveTo.create(unit, place()))

	expect(Commander.isIdle(unit.commander)).toBe(false)
})

test('moving', () => {
	const unit = soldier()
	Commander.scheduleBehind(unit.commander, MoveTo.create(unit, place()))

	advance(150)

	expect(unit.mapCoordinates).toEqual(place())
})

test('save & restore', () => {
	const unit = soldier()
	Commander.scheduleBehind(unit.commander, MoveTo.create(unit, place()))

	advance(50)

	const save = Record.serialize()

	advance(100)
	expect(unit.mapCoordinates).toEqual(place())

	Record.unserialize(save)
	const loadedUnit = Record.dereference(Record.reference(unit))
	expect(loadedUnit.mapCoordinates).not.toEqual(place())

	advance(100)
	expect(loadedUnit.mapCoordinates).toEqual(place())
})