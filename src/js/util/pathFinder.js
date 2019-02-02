import { FibonacciHeap } from '@tyriar/fibonacci-heap'

import Graph from 'util/graph'
import Util from 'util/util'
import Message from 'util/message'

import MapEntity from 'entity/map'
import Tile from 'entity/tile'
import Colony from 'entity/colony'
import Unit from 'entity/unit'


const CANNOT_MOVE_COST = 500
const MIN_TERRAIN_COST = 0.33
const graph = Graph.create()


const initialize = () => {
	const tiles = MapEntity.get().tiles
	Util.range(MapEntity.get().numTiles.total).forEach(index => {
		const center = tiles[index]
		const neighbors = Tile.diagonalNeighbors(center).map(tile => ({
			index: tile.index,
			area: tile.area,
			cost: () => Tile.movementCost(center, tile),
			tile: () => MapEntity.tileFromIndex(tile.index),
		}))

		graph.addNode({
			index: center.index,
			area: center.area,
			tile: () => MapEntity.tileFromIndex(center.index)
		}, neighbors)
	})

	Message.log('Pathfinding initialized')
}

const findNextToArea = (from, area) => {
	const path = find(from, node => node.area === area, null, null)
	// console.log(path)
	return path.length > 1 ? path[path.length - 2] : from
}

const findHighSeas = from => {
	const target = node => node.tile().terrainName === 'sea lane' && node.tile().discovered()
	return find(from, target, null, from.colony ? Colony.area(from.colony, 'sea') : null)
}
const findPathXY = (from, to, unit) => findPath(MapEntity.tile(from), MapEntity.tile(to), unit)
const findPath = (from, to, unit) => {
	return find(from, null, to, Unit.area(unit))
}

const distance = (fromCoords, toCoords, unit, max = CANNOT_MOVE_COST) => {
	const from = MapEntity.tile(fromCoords)
	const to = MapEntity.tile(toCoords)
	const isTarget = node => (node.cost > max || node.index === to.index)
	const path = find(from, isTarget, to, Unit.area(unit))
	return path
		.filter((p, i) => i > 0)
		.reduce(({ distance, from }, to) => ({
			distance: distance + Tile.movementCost(from, to) + ((from.domain === to.domain || from.colony || to.colony) ? 0 : CANNOT_MOVE_COST),
			from: to
		}), { distance: 0, from: path[0] }).distance
}

const	tileDistance = (from, to) => {
	const pos1 = from.mapCoordinates
	const pos2 = to.mapCoordinates
	return Math.max(Math.abs(pos1.x - pos2.x), Math.abs(pos1.y - pos2.y))
}


const find = (from, isTarget, target, area = null) => {
	if (!isTarget) {
		isTarget = node => node.index === target.index
	}

	if (target && area && target.area !== area && !target.colony) {
		const newTarget = findNextToArea(target, area)
		const newIsTarget = node => node.neighbors.some(n => n.index === newTarget.index)
		// console.log(newTarget)
		// console.log(Tile.radius(newTarget).map(tile => tile.area))
		// console.log(Tile.radius(newTarget)
		// 	.filter(tile => tile.area === area)
		// 	.some(tile => newIsTarget(graph.node(tile.index))))

		return find(from, newIsTarget, { ...newTarget, area }, area)
	}


	const frontier = new FibonacciHeap((a, b) => {
		//comparison by used cost
		if(a.key !== b.key)
			return a.key - b.key

		if (!a.value || !b.value) {
			return 0
		}

		//comparison by actual cost (whatever that means by now! isnt cost a function now? or is it not?)
		if(a.value.cost !== b.value.cost)
			return a.value.cost - b.value.cost

		//prefer horizontal or vertical movement to diagonals
		if(Tile.isNextTo(a.value.prev.value.tile(), a.value.tile()))
			return -1

		if(Tile.isNextTo(b.value.prev.value.tile(), b.value.tile()))
			return 1

		return 0
	})

	const relativeEstimate = tile => target ? estimate(tile, target) - estimate(from, target) : 0

	let node = graph.node(from.index)
	const explored = {}
	const inFrontier = {}
	node = frontier.insert(0, node)
	node.value.prev = node
	node.value.cost = 0
	inFrontier[node.value.index] = true

	while (!frontier.isEmpty()) {
		node = frontier.extractMinimum()
		inFrontier[node.value.index] = false
		if (isTarget(node.value)) {
			const path = [node.value.tile()]
			while (node.value.prev !== node){
				node = node.value.prev
				path.push(node.value.tile())
			}

			return path.reverse()
		}

		explored[node.value.index] = true
		node.value.neighbors.forEach(neighbor => {
			if (!explored[neighbor.index] && (!area || neighbor.area === area || neighbor.tile().colony)) {
				const neighborNode = graph.node(neighbor.index)
				const newCost = node.value.cost + neighbor.cost()

				if (!inFrontier[neighbor.index]) {
					neighborNode.prev = node
					neighborNode.cost = newCost
					neighborNode.priority =  newCost + relativeEstimate(neighborNode.tile())

					inFrontier[neighbor.index] = frontier.insert(neighborNode.priority, neighborNode)
				}
				else {
					if (newCost < neighborNode.cost) {
						neighborNode.prev = node
						neighborNode.cost = newCost
						neighborNode.priority = newCost + relativeEstimate(neighborNode.tile())

						frontier.decreaseKey(inFrontier[neighbor.index], neighborNode.priority)
					}
				}
			}
		})
	}

	//no path found :(
	return [from]
}

const estimate = (from, to) => {
	if (from.domain === 'sea') {
		return tileDistance(from, to)
	}

	return MIN_TERRAIN_COST * tileDistance(from, to)
}



export default {
	initialize,
	findPath,
	findPathXY,
	findHighSeas,
	distance
}