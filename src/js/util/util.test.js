import Util from 'util/util'

test('isArray', () => {
	expect(Util.isArray([1, 2, 3])).toBe(true)
	expect(Util.isArray({ key: 'something' })).toBe(false)
	expect(Util.isArray(() => { throw new Error('i must not be executed') })).toBe(false)
})

test('flatten', () => {
	expect(Util.flatten([1, 2, 3])).toEqual([1, 2, 3])
	expect(Util.flatten([1, 2, [3, 4]])).toEqual([1, 2, 3, 4])
	expect(Util.flatten([1, 2, [3, 4, [5, 6]]])).toEqual([1, 2, 3, 4, 5, 6])
})

test('execute', () => {
	let counter = 0
	const f1 = () => counter += 1
	const f2 = null
	const f3 = [f1, f2]
	
	Util.execute(f1)
	expect(counter).toBe(1)

	Util.execute(f2)
	Util.execute(f3)
	expect(counter).toBe(2)

	Util.execute([f1, f2, f3])
	expect(counter).toBe(4)
})

test('min', () => {
	expect(Util.min([1, 2, 3, 4, 5], x => x)).toBe(1)
	expect(Util.min([1, 2, 3, 4, 5], x => -x)).toBe(5)
})

test('minPair', () => {
	expect(Util.minPair([1, 2, 3, 4, 5], [1, 2, 3, 4, 5], (x, y) => x + y)).toEqual({ one: 1, other: 1 })
	expect(Util.minPair([-1, -2, -3, -4, -5], [1, 2, 3, 4, 5], (x, y) => x - y)).toEqual({ one: -5, other: 5 })
})

test('distance', () => {
	expect(Util.distance({ x: 0, y: 0}, { x: 3, y: 4 })).toBe(5)
	expect(Util.distance({ x: -3, y: 0}, { x: 0, y: 4 })).toBe(5)
})

test('uid', () => {
	expect(Util.uid()).not.toBe(Util.uid())
	expect(Util.uid()).not.toBe(Util.uid())
	expect(Util.uid()).not.toBe(Util.uid())
	expect(Util.uid()).not.toBe(Util.uid())
	expect(Util.uid()).not.toBe(Util.uid())
})