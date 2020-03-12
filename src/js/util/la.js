const add = (v, w) => ({
	x: v.x + w.x,
	y: v.y + w.y
})

const madd = (v, m, w) => ({
	x: v.x + m * w.x,
	y: v.y + m * w.y
})

const mmadd = (l, v, m, w) => ({
	x: l * v.x + m * w.x,
	y: l * v.y + m * w.y
})

const lerp = (v, w, lambda) => ({
	x: lambda * v.x + (1.0 - lambda) * w.x,
	y: lambda * v.y + (1.0 - lambda) * w.y
})

const multiply = (m, v) => ({
	x: m * v.x,
	y: m * v.y
})

const subtract = (v, w) => ({
	x: v.x - w.x,
	y: v.y - w.y
})

const normalize = v => ({
	x: v.x / distance(v),
	y: v.y / distance(v)
})

const normalizeManhatten = v => ({
	x: v.x / distanceManhatten(v),
	y: v.y / distanceManhatten(v)
})

const rotate = (alpha, v = { x: 1, y: 0 }) => ({
	x: Math.cos(alpha) * v.x - Math.sin(alpha) * v.y,
	y: Math.sin(alpha) * v.x + Math.cos(alpha) * v.y
})

const rotate90 = v => ({
	x: -v.y,
	y: v.x
})

const product = (v, w = v) => v.x * w.x + v.y * w.y
const vector = (x = 0, y = x) => ({ x, y })

const piecewise = (v, fn) => ({
	x: fn(v.x),
	y: fn(v.y)
})

const round = v => piecewise(v, Math.round)

const factorize = (v, n1, n2) => ({
	x: product(v, n1),
	y: product(v, n2)
})

const sqDistance = (v, w = { x: 0, y: 0 }) => product(subtract(w, v))
const distance = (v, w) => Math.sqrt(sqDistance(v, w))

const distanceManhatten = (v, w = { x: 0, y: 0 }) => {
	const delta = subtract(v, w)
	return Math.max(Math.abs(delta.x), Math.abs(delta.y))
}

const random = (x, y) => ({
	x: Math.random() * x,
	y: Math.random() * y
})

const min = (...args) => ({
	x: Math.min(...args.map(v => v.x)),
	y: Math.min(...args.map(v => v.y))
})

const max = (...args) => ({
	x: Math.max(...args.map(v => v.x)),
	y: Math.max(...args.map(v => v.y))
})

const intersect = (line1, line2) => {
	const normal1 = rotate90(subtract(line1.point1, line1.point2))
	const offset1 = product(line1.point1, normal1)
	const normal2 = rotate90(subtract(line2.point1, line2.point2))
	const offset2 = product(line2.point1, normal2)

	return (product(line2.point1, normal1) - offset1) * (product(line2.point2, normal1) - offset1) < 0 &&
		(product(line1.point1, normal2) - offset2) * (product(line1.point2, normal2) - offset2) < 0
}

export default {
	add,
	madd,
	mmadd,
	lerp,
	subtract,
	multiply,
	distance,
	sqDistance,
	normalize,
	normalizeManhatten,
	product,
	rotate,
	rotate90,
	factorize,
	piecewise,
	round,
	random,
	min,
	max,
	intersect,
	vector,
	v: vector,
	w: vector
}
