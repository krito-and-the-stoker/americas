import 'test/min-setup'

import Util from 'util/util'
import PathFinder from 'util/pathFinder'
import Time from 'timeline/time'
import Unit from 'entity/unit'
import Owner from 'entity/owner'
import Commander from 'command/commander'
import MoveTo from 'command/moveTo'

beforeAll(() => {	
	PathFinder.initialize()
})

test('moveTo', () => {
	const target = { x: 5, y: 5 }
	const unit = Unit.create('settler', { x: 1, y: 1 }, Owner.player())
	Commander.scheduleInstead(unit.commander, MoveTo.create(unit, target))

	Util.range(100).forEach(() => Time.advance(1000))
	expect(unit.mapCoordinates).toEqual(target)
})

test('scheduleInstead', () => {
	const target = { x: 5, y: 5 }
	const otherTarget = { x: 3, y: 1}
	const unit = Unit.create('settler', { x: 1, y: 1 }, Owner.player())
	Commander.scheduleInstead(unit.commander, MoveTo.create(unit, target))
	Time.advance(1000)
	Time.advance(1000)
	Time.advance(1000)
	Commander.scheduleInstead(unit.commander, MoveTo.create(unit, otherTarget))

	Util.range(100).forEach(() => Time.advance(1000))
	expect(unit.mapCoordinates).toEqual(otherTarget)
})

test('clearSchedule', () => {
	const target = { x: 5, y: 1 }
	const otherTarget = { x: 1, y: 4}
	const unit = Unit.create('settler', { x: 1, y: 1 }, Owner.player())
	Commander.scheduleInstead(unit.commander, MoveTo.create(unit, target))
	Time.advance(1000)
	Time.advance(1000)
	Time.advance(1000)
	Commander.clearSchedule(unit.commander)

	Util.range(20).forEach(() => Time.advance(1000))
	expect(unit.mapCoordinates).toEqual({ x: 2, y: 1})

	Commander.scheduleInstead(unit.commander, MoveTo.create(unit, otherTarget))

	Util.range(100).forEach(() => Time.advance(1000))
	expect(unit.mapCoordinates).toEqual(otherTarget)
})

test('clearSchedule followed by scheduleInstead', () => {
	const target = { x: 5, y: 1 }
	const otherTarget = { x: 1, y: 4}
	const unit = Unit.create('settler', { x: 1, y: 1 }, Owner.player())
	Commander.scheduleInstead(unit.commander, MoveTo.create(unit, target))
	Time.advance(1000)
	Time.advance(1000)
	Time.advance(1000)
	Commander.clearSchedule(unit.commander)
	Commander.scheduleInstead(unit.commander, MoveTo.create(unit, otherTarget))

	Util.range(100).forEach(() => Time.advance(1000))
	expect(unit.mapCoordinates).toEqual(otherTarget)	
})