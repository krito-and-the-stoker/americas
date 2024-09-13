import empty from './empty'
import move from './move'

const level0 = empty

const properties = {
	texture: 'prod_compl_townhall_carpenter_4k'
}

const level1 = [{
	position: {
		x: 0,
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
		x: 3,
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
		x: 5,
		y: 0,
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
		y: 0,
	},
	width: 1,
	height: 2,
	shape: [
		[3],
		[1]
	],
	...properties,
}]

const level2 = level1.map(entry => move(entry, 0, 6))
const level3 = level1.map(entry => move(entry, 0, 12))

export default {
	level: [
		level0,
		level1,
		level2,
		level3
	]
}