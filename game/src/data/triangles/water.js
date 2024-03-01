import empty from './empty'

const properties = {
	width: 1,
	height: 1,
}

const level0 = empty

const move = (entry, x, y, extra = {}) => ({
	...entry,
	position: {
		x: entry.position.x + x,
		y: entry.position.y + y,
	},
	// ...extra,
})

const base = [{
	...properties,
	position: {
		x: 16,
		y: 31 + 14,
	},
	shape: [[1]],
}, {
	...properties,
	position: {
		x: 18,
		y: 31 + 14,
	},
	shape: [[2]],
}, {
	...properties,
	position: {
		x: 20,
		y: 31 + 14,
	},
	shape: [[3]],
}, {
	...properties,
	position: {
		x: 22,
		y: 31 + 14,
	},
	shape: [[4]],
}]


export default {
	...base
}