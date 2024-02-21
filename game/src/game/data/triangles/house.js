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
		x: 0,
		y: 47,
	},
	shape: [[1]],
}, {
	...properties,
	position: {
		x: 2,
		y: 47,
	},
	shape: [[2]],
}, {
	...properties,
	position: {
		x: 4,
		y: 47,
	},
	shape: [[3]],
}, {
	...properties,
	position: {
		x: 6,
		y: 47,
	},
	shape: [[4]],
}]

const level1 = [
	base.map(e => move(e, 0, 0, { density: 7 })),
	base.map(e => move(e, 8, 0, { density: 4 })),
	base.map(e => move(e, 0, 2, { density: 5 })),
	base.map(e => move(e, 8, 2, { density: 3 })),
	base.map(e => move(e, 0, 4, { density: 6 })),
	base.map(e => move(e, 8, 4, { density: 5 })),
	base.map(e => move(e, 0, 6, { density: 6 })),
	base.map(e => move(e, 8, 6, { density: 5 })),
	base.map(e => move(e, 0, 8, { density: 4 })),
	base.map(e => move(e, 8, 8, { density: 2 })),
	base.map(e => move(e, 0, 10, { density: 3 })),
	base.map(e => move(e, 8, 10, { density: 2 })),
	base.map(e => move(e, 0, 12, { density: 3 })),
	base.map(e => move(e, 8, 12, { density: 2 })),
].flat()


export default {
	level: [
		level0,
		level1,
	]
}