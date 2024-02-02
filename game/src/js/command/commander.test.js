import 'test/min-setup'

import Util from 'util/util'
import PathFinder from 'util/pathFinder'
import Time from 'timeline/time'
import Unit from 'entity/unit'
import Commander from 'command/commander'
import MoveTo from 'command/moveTo'

beforeAll(() => {	
	PathFinder.initialize()
})

const place = () => ({ x: 1, y: 1 })
const otherPlace = () => ({ x: 3, y: 1 })
const farPlace = () => ({ x: 5, y: 5 })

test('moveTo', () => {
	const unit = Unit.create('settler', place())
	Commander.scheduleInstead(unit.commander, MoveTo.create({ unit, coords: farPlace() }))

	Util.range(100).forEach(() => Time.advance(1000))
	expect(unit.mapCoordinates).toEqual(farPlace())
})

test('moveTo again', () => {
	const unit = Unit.create('settler', place())
	Commander.scheduleInstead(unit.commander, MoveTo.create({ unit, coords: farPlace() }))

	Util.range(100).forEach(() => Time.advance(1000))
	expect(unit.mapCoordinates).toEqual(farPlace())
})

test('scheduleInstead', () => {
	const unit = Unit.create('settler', place())
	Commander.scheduleInstead(unit.commander, MoveTo.create({ unit, coords: farPlace() }))
	Time.advance(1000)
	Time.advance(1000)
	Time.advance(1000)
	Commander.scheduleInstead(unit.commander, MoveTo.create({ unit, coords: otherPlace() }))

	Util.range(100).forEach(() => Time.advance(1000))
	expect(unit.mapCoordinates).toEqual(otherPlace())
})

test('clearSchedule and reschedule', () => {
	const target = { x: 5, y: 1 }
	const secondTarget = { x: 2, y: 1 }
	const otherTarget = { x: 1, y: 4}
	const unit = Unit.create('settler', { x: 1, y: 1 })
	Commander.scheduleInstead(unit.commander, MoveTo.create({ unit, coords: target }))

	Util.range(9).forEach(() => Time.advance(1000))
	Commander.clearSchedule(unit.commander)

	Commander.scheduleInstead(unit.commander, MoveTo.create({ unit, coords: secondTarget }))
	Util.range(30).forEach(() => Time.advance(1000))
	expect(unit.mapCoordinates).toEqual(secondTarget)

	Commander.scheduleInstead(unit.commander, MoveTo.create({ unit, coords: otherTarget }))

	Util.range(100).forEach(() => Time.advance(1000))
	expect(unit.mapCoordinates).toEqual(otherTarget)
})

test('clearSchedule followed by scheduleInstead', () => {
	const target = { x: 5, y: 1 }
	const otherTarget = { x: 1, y: 4}
	const unit = Unit.create('settler', { x: 1, y: 1 })
	Commander.scheduleInstead(unit.commander, MoveTo.create({ unit, coords: target }))
	Time.advance(1000)
	Time.advance(1000)
	Time.advance(1000)
	Commander.clearSchedule(unit.commander)
	Commander.scheduleInstead(unit.commander, MoveTo.create({ unit, coords: otherTarget }))

	Util.range(100).forEach(() => Time.advance(1000))
	expect(unit.mapCoordinates).toEqual(otherTarget)	
})