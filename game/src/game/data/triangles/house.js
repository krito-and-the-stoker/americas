import empty from './empty'

const properties = {
	width: 1,
	height: 1,
}

const level0 = empty

const level1 = [{
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

export default {
	level: [
		level0,
		level1,
	]
}