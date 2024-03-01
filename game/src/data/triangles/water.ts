import Layout from 'entity/layout'

const properties = {
	width: 1,
	height: 1,
}


const move = (entry: Record<string, any>, x: number, y: number, extra = {}) => ({
	...entry,
	position: {
		x: entry.position.x + x,
		y: entry.position.y + y,
	},
	...extra,
})

const base = [{
	...properties,
	position: {
		x: 16,
		y: 31 + 14,
	},
	shape: [[1]],
	border: 0,
}, {
	...properties,
	position: {
		x: 18,
		y: 31 + 14,
	},
	shape: [[2]],
	border: 0,
}, {
	...properties,
	position: {
		x: 20,
		y: 31 + 14,
	},
	shape: [[3]],
	border: 0,
}, {
	...properties,
	position: {
		x: 22,
		y: 31 + 14,
	},
	shape: [[4]],
	border: 0,
}]


export default [
	...base,
	...base.map(entry => move(entry, 0, -2, { border: Layout.encodeBorder(true, false, false ) })),
	...base.map(entry => move(entry, 0, -4, { border: Layout.encodeBorder(false, false, true ) })),
	...base.map(entry => move(entry, 0, -6, { border: Layout.encodeBorder(false, true, false ) })),
	...base.map(entry => move(entry, 0, -8, { border: Layout.encodeBorder(false, true, true ) })),
	...base.map(entry => move(entry, 0, -10, { border: Layout.encodeBorder(true, true, false ) })),
	...base.map(entry => move(entry, 0, -12, { border: Layout.encodeBorder(true, false, true ) })),
	...base.map(entry => move(entry, 0, -14, { border: Layout.encodeBorder(true, true, true ) })),
]
