import empty from './empty'
import move from './move'

const properties = {
	texture: 'prod_compl_townhall_carpenter_4k'
}

const level0 = [{
	position: {
		x: 0,
		y: 18,
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
		y: 18,
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
		y: 18,
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
		y: 18,
	},
	width: 1,
	height: 2,
	shape: [
		[3],
		[1]
	],
	...properties,
}]

const level1 = level0
const level2 = level0.map(entry => move(entry, 0, 6))
const level3 = [{
	position: {
		x: 10,
		y: 0,
	},
	width: 2,
	height: 1,
	shape: [
		[3, 1]
	],
	...properties,
}, {
	position: {
		x: 13,
		y: 0,
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
		x: 10,
		y: 6,
	},
	width: 2,
	height: 1,
	shape: [
		[4, 2]
	],
	...properties,
}, {
	position: {
		x: 13,
		y: 6,
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
		level2,
		level3,
	]
}