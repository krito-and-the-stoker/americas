import Triangles from 'data/triangles'
import Util from 'util/util'
import LA from 'util/la'

import Tile from 'entity/tile'
import Colony from 'entity/colony'

const SIZE_X = 15
const SIZE_Y = 15

const create = () => {
	// SIZE_X * SIZE_Y array of zeros
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

const putLayout = (baseLayout, testLayout, offsetX = 0, offsetY = 0) => {
	return iterate(testLayout).forEach(({ shape, x, y }) => {
		return putTriangle(baseLayout, offsetX + x, offsetY + y, shape)
	})
}

// building is currently not used, but most likely it will be
const landValueMap = (colony, building) => {
	const landValue = create()
	const iterateLandValue = iterate(landValue)

	// fixed good value at center
	iterateLandValue.forEach(entry => {
		set(landValue, entry.x, entry.y, Math.random())
	})
	set(landValue, Math.floor(SIZE_X / 2), Math.floor(SIZE_Y / 2), 5)

	colony.newBuildings.forEach(otherBuilding => {
		otherBuilding.placement.forEach(place => {
			const center = place.position

			const keepDistance = (center, entry) => 3.0 / (1.0 + LA.sqDistance(center, entry))
			const attraction = (center, entry) => 4.5 / (2.0 + LA.sqDistance(center, entry))
			const buildingExtra = (center, entry) => (
				otherBuilding.name === 'house' ?
					0
				: otherBuilding.name === 'church' ?
					1
				: otherBuilding.name === 'townhall' ?
					1
				: 0) / (1.0 + LA.sqDistance(center, entry))

			iterateLandValue.forEach(entry => {
				update(landValue, entry.x, entry.y, value =>
					value + attraction(center, entry) - keepDistance(center, entry) + buildingExtra(center, entry)
				)
			})
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


const placeWater = colony => {
	const surrounding = Tile.diagonalNeighbors(Colony.tile(colony))
		.filter(tile => tile.domain === 'sea')
		.map(tile => LA.subtract(tile.mapCoordinates, colony.mapCoordinates))
	const waterMap = create()
	surrounding.forEach(coords => {
		// west coast
		if (coords.x === 1 && coords.y === 0) {
			iterate(waterMap).forEach(({ x, y }) => {
				if (x === SIZE_X - 1) {
					set(waterMap, x, y, 3.5 * Math.random())
				}
			})
		}
		// south coast
		if (coords.x === 0 && coords.y === 1) {
			iterate(waterMap).forEach(({ x, y }) => {
				if (y === SIZE_Y - 1) {
					set(waterMap, x, y, 3.5 * Math.random())
				}
			})
		}
	})

	// grow water
	let growMore = true
	while(growMore) {
		growMore = false
		iterate(waterMap).forEach(({ x, y, shape }) => {
			if (shape > 1) {
				if (get(waterMap, x + 1, y) < shape - 1) {
					growMore = true
					set(waterMap, x + 1, y, shape - 1)
				}
				if (get(waterMap, x - 1, y) < shape - 1) {
					growMore = true
					set(waterMap, x - 1, y, shape - 1)
				}
				if (get(waterMap, x, y + 1) < shape - 1) {
					growMore = true
					set(waterMap, x, y + 1, shape - 1)
				}
				if (get(waterMap, x, y - 1) < shape - 1) {
					growMore = true
					set(waterMap, x, y - 1, shape - 1)
				}
			}
		})
	}

	iterate(waterMap).forEach(({ x, y, shape}) => {
		set(waterMap, x, y, shape > 0 ? 5 : 0)
	})

	putLayout(colony.layout, waterMap)
	return waterMap
}


export default {
	create, load, save, iterate, placeBuilding, placeWater
}