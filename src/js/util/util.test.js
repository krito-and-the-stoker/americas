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

test('minDistance', () => {
	const many = [
		{x: 205, y: 322},
		{x: 169, y: 322},
		{x: 183, y: 340},
		{x: 208, y: 324},
		{x: 177, y: 315},
		{x: 194, y: 341},
		{x: 182, y: 311},
		{x: 197, y: 318},
		{x: 168, y: 311},
		{x: 198, y: 321},
		{x: 167, y: 329},
		{x: 198, y: 337},
		{x: 170, y: 332},
		{x: 197, y: 340},
		{x: 197, y: 326},
		{x: 205, y: 318},
		{x: 212, y: 321},
		{x: 166, y: 320},
		{x: 204, y: 330},
		{x: 196, y: 314},
		{x: 208, y: 332},
		{x: 213, y: 330},
		{x: 171, y: 327},
		{x: 189, y: 315},
		{x: 184, y: 351},
		{x: 177, y: 319},
		{x: 166, y: 323},
		{x: 191, y: 336},
		{x: 187, y: 342},
		{x: 188, y: 332},
		{x: 194, y: 337},
		{x: 175, y: 326},
		{x: 190, y: 321},
		{x: 177, y: 343},
		{x: 180, y: 313},
		{x: 178, y: 349},
		{x: 203, y: 319},
		{x: 201, y: 327},
		{x: 181, y: 351},
		{x: 194, y: 323},
		{x: 182, y: 321},
		{x: 175, y: 332},
		{x: 204, y: 334},
		{x: 213, y: 326},
		{x: 179, y: 335},
		{x: 210, y: 320},
		{x: 201, y: 322},
		{x: 167, y: 317},
		{x: 191, y: 329},
		{x: 184, y: 328},
		{x: 179, y: 328},
		{x: 203, y: 338},
		{x: 184, y: 312},
		{x: 190, y: 325},
		{x: 204, y: 326},
		{x: 186, y: 318},
		{x: 174, y: 314},
		{x: 207, y: 335},
		{x: 183, y: 332},
		{x: 190, y: 345},
		{x: 166, y: 326},
		{x: 200, y: 339},
		{x: 200, y: 335},
		{x: 195, y: 331},
		{x: 187, y: 351},
		{x: 211, y: 331},
		{x: 205, y: 336},
		{x: 173, y: 338},
		{x: 173, y: 321},
		{x: 181, y: 318},
		{x: 211, y: 325},
		{x: 175, y: 311},
		{x: 191, y: 318},
		{x: 184, y: 324},
		{x: 200, y: 331},
		{x: 181, y: 346},
		{x: 184, y: 336},
		{x: 181, y: 342},
		{x: 177, y: 346},
		{x: 201, y: 316},
		{x: 178, y: 323},
		{x: 183, y: 348},
		{x: 208, y: 328},
		{x: 194, y: 318},
	]

	const one = {x: 203, y: 340}

	expect(Util.minDistance(many, one)).toBe(2)
})

test('uid', () => {
	expect(Util.uid()).not.toBe(Util.uid())
	expect(Util.uid()).not.toBe(Util.uid())
	expect(Util.uid()).not.toBe(Util.uid())
	expect(Util.uid()).not.toBe(Util.uid())
	expect(Util.uid()).not.toBe(Util.uid())
})