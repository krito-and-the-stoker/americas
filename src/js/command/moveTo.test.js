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
const farPlace = () => ({ x: 6, y: 8 })
const firstPlace = () => ({ x: 1, y: 2 })

test('create & schedule', () => {
	const unit = soldier()
	Commander.scheduleBehind(unit.commander, MoveTo.create({ unit: unit, coords: place() }))
})

test('moving', () => {
	const unit = soldier()
	Commander.scheduleBehind(unit.commander, MoveTo.create({ unit: unit, coords: place() }))

	advance(150)

	expect(unit.mapCoordinates).toEqual(place())
})

test('save & restore', () => {
	const unit = soldier()
	Commander.scheduleBehind(unit.commander, MoveTo.create({ unit: unit, coords: place() }))

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

test('schedule instead & schedule behind', () => {
	const joe = soldier()
	const jack = soldier()
	const john = soldier()

	// start walking
	Commander.scheduleInstead(joe.commander, MoveTo.create({ unit: joe, coords: farPlace() }))
	Commander.scheduleInstead(jack.commander, MoveTo.create({ unit: jack, coords: farPlace() }))
	Commander.scheduleInstead(john.commander, MoveTo.create({ unit: john, coords: farPlace() }))

	advance(25)

	// send joe back
	Commander.scheduleInstead(joe.commander, MoveTo.create({ unit: joe, coords: firstPlace() }))

	// schedule jack back
	Commander.scheduleBehind(jack.commander, MoveTo.create({ unit: jack, coords: firstPlace() }))

	advance(125)

	// joe should have made it back by now
	expect(joe.mapCoordinates).toEqual(firstPlace())

	// the others should still be walking
	expect(jack.mapCoordinates).not.toEqual(farPlace())
	expect(john.mapCoordinates).not.toEqual(farPlace())

	advance(125)
	// jack should be there now
	expect(john.mapCoordinates).toEqual(farPlace())
	// jack should be still on his way
	expect(jack.mapCoordinates).not.toEqual(farPlace())
	expect(jack.mapCoordinates).not.toEqual(firstPlace())

	advance(250)
	// jack should have made it eventually
	expect(jack.mapCoordinates).toEqual(firstPlace())
})
