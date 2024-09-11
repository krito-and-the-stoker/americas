import empty from './empty'
import move from './move'

const level0 = empty

const properties = {
	width: 1,
	height: 1,
	shape: [[5]],
	texture: 'prod_compl_church_tabacco_education_cloth_4k',
}

const level1 = [{
	position: {
		x: 0,
		y: 0,
	},
	...properties,
}, {
	position: {
		x: 2,
		y: 0,
	},
	...properties,
}, {
	position: {
		x: 4,
		y: 0,
	},
	...properties,
}, {
	position: {
		x: 6,
		y: 0,
	},
	...properties,
}]

const level2 = level1.map(entry => move(entry, 0, 4))
const level3 = level1.map(entry => move(entry, 0, 6))

export default {
	level: [
		level0,
		level1,
		level2,
		level3
	]
}