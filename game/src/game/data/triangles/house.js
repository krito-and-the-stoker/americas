import empty from './empty'

const properties = {
	width: 1,
	height: 1,
}

const level0 = empty

const move = (entry, x, y) => ({
	...entry,
	position: {
		x: entry.position.x + x,
		y: entry.position.y + y,
	}
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

const row = [...base, ...base.map(entry => move(entry, 8, 0))]

const level1 = Array(7).fill().flatMap((_, i) => row.map(entry => move(entry, 0, 2*i)))
console.log(level1)

export default {
	level: [
		level0,
		level1,
	]
}