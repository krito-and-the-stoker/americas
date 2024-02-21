import Triangles from 'data/triangles'
import Util from 'util/util'
import LA from 'util/la'


const SIZE_X = 10
const SIZE_Y = 10

const create = () => {
	// 20x20 array of zeros
	return Array(SIZE_Y).fill().map(() => (Array(SIZE_X).fill(0)))
}

const load = data => data
const save = data => data

// note: x and y are transposed
const get = (layout, x, y) => layout[y] ? layout[y][x] : undefined
const set = (layout, x, y, value) => {
	layout[y][x] = value
}
const update = (layout, x, y, fn) => {
	layout[y][x] = fn(layout[y][x])
}

const canPutTriangle = (layout, x, y, shape) => {
	const haveShape = get(layout, x, y)
	if (haveShape === 0) {
		return true
	}
	if (haveShape === 1) {
		return shape === 3
	}
	if (haveShape === 2) {
		return shape === 4
	}
	if (haveShape === 3) {
		return shape === 1
	}
	if (haveShape === 4) {
		return shape === 2
	}
	if (haveShape === 5) {
		return false
	}

	// out of bounds
	if (haveShape === undefined) {
		return false
	}

	console.warn('Unknown shape in layout', layout, x, y, haveShape)
	return false
}

// assumes the triangle CAN be put
const putTriangle = (layout, x, y, shape) => {
	const haveShape = get(layout, x, y)
	if (haveShape === 0) {
		set(layout, x, y, shape)
	} else {
		// two triangles always combine into a square
		set(layout, x, y, 5)
	}
}

const iterate = layout => layout.flatMap((inner, y) => inner.map((shape, x) => ({ shape, x, y })))

const canPutLayout = (baseLayout, testLayout, offsetX, offsetY) => {
	return iterate(testLayout).every(({ shape, x, y }) => {
		return canPutTriangle(baseLayout, offsetX + x, offsetY + y, shape)
	})
}

const putLayout = (baseLayout, testLayout, offsetX, offsetY) => {
	return iterate(testLayout).forEach(({ shape, x, y }) => {
		return putTriangle(baseLayout, offsetX + x, offsetY + y, shape)
	})
}

// building is currently not used, but most likely it will be
const landValueMap = (colony, building) => {
	const landValue = create()

	// fixed good value at center
	iterate(landValue).forEach(entry => {
		set(landValue, entry.x, entry.y, 0.5 * Math.random())
	})
	set(landValue, Math.floor(SIZE_X / 2), Math.floor(SIZE_Y / 2), 5)

	colony.newBuildings.forEach(building => {
		building.center = {
			x: building.position.x + 0.5 * building.width,
			y: building.position.y + 0.5 * building.height,
		}

		iterate(landValue).forEach(entry => {
			update(landValue, entry.x, entry.y, value =>
				value + 4.0 / (2.0 + LA.sqDistance(building.center, entry)) - 3.0 / (1.0 + LA.sqDistance(building.center, entry))
			)
		})
	})

	return landValue
}

const placeBuilding = (colony, building) => {
	const landValue = iterate(landValueMap(colony, building)).sort((a, b) => b.shape - a.shape)
	const triangles = building.triangles.level[building.level]

	for(const entry of landValue) {
		const fit = Util.disordered(triangles).find(triangle => canPutLayout(colony.layout, triangle.shape, entry.x, entry.y))
		if (fit) {
			putLayout(colony.layout, fit.shape, entry.x, entry.y)
			console.log('found placement', colony.name, building, entry)
			return {
				position: {
					x: entry.x,
					y: entry.y,
				},
				triangle: fit,
			}
		}
	}

	console.error('Could not fid building into colony', colony.name, iterate(colony.layout), building, landValue)
}


export default {
	create, load, save, placeBuilding
}