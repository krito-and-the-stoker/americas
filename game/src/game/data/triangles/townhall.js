import empty from './empty'

const level0 = empty

const properties = {
}

const level1 = [{
	position: {
		x: 0,
		y: 5,
	},
	width: 2,
	height: 1,
	shape: [
		[3, 1]
	],
	...properties,
}, {
	position: {
		x: 3,
		y: 5,
	},
	width: 1,
	height: 2,
	shape: [
		[2],
		[4]
	],
	...properties,
}, {
	position: {
		x: 5,
		y: 5,
	},
	width: 2,
	height: 1,
	shape: [
		[4, 2]
	],
	...properties,
}, {
	position: {
		x: 8,
		y: 5,
	},
	width: 1,
	height: 2,
	shape: [
		[3],
		[1]
	],
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