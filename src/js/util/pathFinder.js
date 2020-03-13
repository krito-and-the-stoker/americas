import { FibonacciHeap } from '@tyriar/fibonacci-heap'

import LA from 'util/la'

import MapEntity from 'entity/map'
import Tile from 'entity/tile'
import Unit from 'entity/unit'


const CANNOT_MOVE_COST = 500
const MIN_TERRAIN_COST = 0.33
const MIN_SEA_COST = 1
const EUROPE_TRAVEL_COST = 111

const tile = MapEntity.tile

const allNeighbors = coords => tile(coords)
	? Tile.diagonalNeighbors(tile(coords))
	: [tile({
		x: Math.floor(coords.x),
		y: Math.floor(coords.y)
	}), tile({
		x: Math.floor(coords.x),
		y: Math.ceil(coords.y)
	}), tile({
		x: Math.ceil(coords.x),
		y: Math.floor(coords.y)
	}), tile({
		x: Math.ceil(coords.x),
		y: Math.ceil(coords.y)
	})]

const getNeighborsForUnit = unit => node => allNeighbors(node.coords)
	.filter(t => t.area === Unit.area(unit))
	.filter(t => unit.properties.canExplore || t.discoveredBy.includes(unit.owner))
	.map(t => t.mapCoordinates)

const getCostForUnit = unit => (n1, n2) => Tile.movementCost(n1.coords, n2.coords)
const mapToCoords = path => path.map(node => node.coords)
const reduceToDistance = path => path[path.length - 1].cost

const findNextToArea = (coords, unit) => {
	const area = Unit.area(unit)
	const isTarget = node => tile(node.coords) && tile(node.coords).area === area

	const path = runDijksrta(coords,
		isTarget,
		getNeighborsForUnit(unit),
		getCostForUnit(unit),
		relativeEstimate())

	return path && path.length > 1 ? path[path.length - 2].coords : coords
}

const findHighSeas = (coords, unit) => {
	const isTarget = node => tile(node.coords) && tile(node.coords).terrainName === 'sea lane'

	return mapToCoords(runDijksrta(coords,
		isTarget,
		getNeighborsForUnit(unit),
		getCostForUnit(unit),
		relativeEstimate()))
}

const findPath = (fromCoords, toCoords, unit) => {
	// console.log('find path', fromCoords, toCoords, unit.name, unit.domain)
	const area = Unit.area(unit)
	const target = MapEntity.tile(toCoords)
	if (!target) {
		console.warn('toCoords must resolve to a tile')
		return null
	}

	if (target.area !== area) {
		const newCoords = findNextToArea(fromCoords, unit)
		console.log('cannot move to target, different areas')
		return findPath(fromCoords, newCoords, unit)
	}

	const isTarget = node => tile(node.coords) && tile(node.coords) === target

	const path = runDijksrta(fromCoords,
		isTarget,
		getNeighborsForUnit(unit),
		getCostForUnit(unit),
		relativeEstimate(fromCoords, toCoords, unit.domain))

	return mapToCoords(path)
}

const NEAR_COLONY_COST = 6
const findNearColony = unit => {
	const isTarget = node => node.cost > NEAR_COLONY_COST || (tile(node.coords) && tile(node.coords).colony)
	const result = runDijksrta(unit.mapCoordinates,
		isTarget,
		getNeighborsForUnit(unit),
		getCostForUnit(unit),
		relativeEstimate()).pop()

	return tile(result.coords) && tile(result.coords).colony
}

const distance = (fromCoords, toCoords, unit, max = CANNOT_MOVE_COST) => {
	const isTarget = node => node.cost > max || tile(node.coords) && tile(node.coords) === tile(toCoords)

	return reduceToDistance(runDijksrta(fromCoords,
		isTarget,
		getNeighborsForUnit(unit),
		getCostForUnit(unit),
		relativeEstimate(fromCoords, toCoords, unit.domain)))
}

const distanceToEurope = coords => {
	// TODO: Calculate this properly with find high seas
	return EUROPE_TRAVEL_COST
}


const relativeEstimate = (startCoords, targetCoords, domain) => coords =>
	(startCoords && targetCoords
		? estimate(coords, targetCoords, domain) - estimate(startCoords, targetCoords, domain)
		: 0)
const estimate = (v, w, domain) => {
	if (domain === 'sea') {
		return MIN_SEA_COST * LA.distanceManhatten(v, w)
	}

	return MIN_TERRAIN_COST * LA.distanceManhatten(v, w)
}


const initialize = () => {}

const createHeap = () => new FibonacciHeap((a, b) => {
	//comparison by used cost
	if(a.key !== b.key)
		return a.key - b.key

	if (!a.value || !b.value) {
		return 0
	}

	if(a.value.cost !== b.value.cost)
		return a.value.cost - b.value.cost

	return 0
})

const nodePool = {}
const getNode = (coords, prev, cost) => {
	const k = key({ coords })
	if (!nodePool[k]) {
		nodePool[k] = { coords, prev, cost }
	}
	
	return nodePool[k]
}
const key = ({ coords }) => `${coords.x}/${coords.y}`
const runDijksrta = (startCoordinates, isTarget, getNeighbors, getCost, minimumEstimate) => {
	const heap = createHeap()
	let node = getNode(startCoordinates)
	node.prev = node
	node.cost = 0

	const add = (list, node) => {
		list[key(node)] = node.needle
	}
	const remove = (list, node) => {
		list[key(node)] = undefined
	}
	const has = (list, node) => list[key(node)]

	const constructPath = node => {
		const path = [node]
		while (node.prev !== node){
			node = node.prev
			path.push(node)
		}

		return path.reverse()
	}

	const explored = {}
	const frontier = {}
	node.needle = heap.insert(0, node)
	add(frontier, node)

	while (!heap.isEmpty()) {
		let needle = heap.extractMinimum()
		node = needle.value
		remove(frontier, node)

		if (isTarget(node)) {
			return constructPath(node)
		}

		add(explored, node)
		// console.log(node.coords, node.cost)
		getNeighbors(node)
			.map(coords => getNode(coords))
			.filter(neighbor => !has(explored, neighbor))
			.forEach(neighbor => {
				const cost = node.cost + getCost(node, neighbor)
				const prev = node
				const priority = cost + minimumEstimate(neighbor.coords)

				if (!has(frontier, neighbor)) {
					neighbor.prev = prev
					neighbor.cost = cost
					neighbor.needle = heap.insert(priority, neighbor)
					add(frontier, neighbor)
				} else if (neighbor.cost && cost < neighbor.cost) {
					neighbor.prev = prev
					neighbor.cost = cost
					heap.decreaseKey(neighbor.needle, priority)
				}
			})
	}
}


export default {
	initialize,
	findPath,
	findHighSeas,
	findNearColony,
	distance,
	distanceToEurope
}