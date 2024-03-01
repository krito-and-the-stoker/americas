import empty from './empty'

const level0 = empty

const properties = {
	width: 1,
	height: 1,
	shape: [[5]],
}

const level1 = [{
	position: {
		x: 0,
		y: 2,
	},
	...properties,
}, {
	position: {
		x: 2,
		y: 2,
	},
	...properties,
}, {
	position: {
		x: 4,
		y: 2,
	},
	...properties,
}, {
	position: {
		x: 6,
		y: 2,
	},
	...properties,
}]

export default {
	level: [
		level0,
		level1,
		level1,
		level1
	]
}