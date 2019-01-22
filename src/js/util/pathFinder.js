import Graph from '../util/graph';
import Util from '../util/util'
import { FibonacciHeap } from '@tyriar/fibonacci-heap';
import MapEntity from '../entity/map'
import Tile from '../entity/tile'
import Message from '../view/ui/message'

const UNDISCOVERED_COST = 5
const CANNOT_MOVE_COST = 500
const MIN_TERRAIN_COST = 0.33
const graph = Graph.create()


const initialize = () => {
	const isInnerTile = center =>
		center.up() &&
		center.left() &&
		center.down() &&
		center.right() &&
		center.up().left() &&
		center.up().right() &&
		center.down().left() &&
		center.down().right()

	const tiles = MapEntity.get().tiles
	Util.range(MapEntity.get().numTiles.total).forEach(index => {
		const center = tiles[index]
		const neighbors = Tile.diagonalNeighbors(center).map(tile => ({
			index: tile.index,
			cost: () => Tile.movementCost(center, tile),
			tile: () => MapEntity.tileFromIndex(tile.index)
		}))

		graph.addNode({
			index: center.index,
			tile: () => MapEntity.tileFromIndex(center.index)
		}, neighbors);
	})

	Message.log('Pathfinding initialized')
}

// const findDomainChange = (from, unit) => {
// 	const target = node => node.tile.domain !== unit.domain
// 	return find(from, target, null, true, unit);
// }

const findHighSeas = from => {
	const target = node => node.tile().terrainName === 'sea lane' && node.tile().discovered
	return find(from, target, null, false, { domain: 'sea' })
}
const findPathXY = (from, to, unit) => findPath(MapEntity.tile(from), MapEntity.tile(to), unit)
const findPath = (from, to, unit) => {
	const target = node => node.index === to.index
	return find(from, target, to, false, unit)
}

const distance = (from, to, unit) => {
	const path = findPathXY(from, to, unit)
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


const find = (from, isTarget, target, freeDomainCross, unit) => {
	const frontier = new FibonacciHeap((a, b) => {
		//comparison by used cost
		if(a.key !== b.key)
			return a.key - b.key;

		if (!a.value || !b.value) {
			return 0
		}

		//comparison by actual cost (whatever that means by now! isnt cost a function now? or is it not?)
		if(a.value.cost !== b.value.cost)
			return a.value.cost - b.value.cost;

		//prefer horizontal or vertical movement to diagonals
		if(Tile.isNextTo(a.value.prev.value.tile(), a.value.tile()))
			return -1;

		if(Tile.isNextTo(b.value.prev.value.tile(), b.value.tile()))
			return 1;

		return 0;
	});

	const relativeEstimate = tile => target ? estimate(tile, target, unit) - estimate(from, target, unit) : 0

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
		if(isTarget(node.value)){
			const path = [node.value.tile()]
			while(node.value.prev !== node){
				node = node.value.prev
				path.push(node.value.tile())
			}

			return path.reverse()
		}

		explored[node.value.index] = true
		node.value.neighbors.forEach(neighbor => {
			if(!explored[neighbor.index]){
				let neighborNode = graph.node(neighbor.index)
				let newCost = node.value.cost + neighbor.cost()
				if(unit.domain !== node.value.tile().domain && !node.value.tile().colony){
					if(freeDomainCross)
						newCost = 0
					else
						newCost += CANNOT_MOVE_COST
				}


				if(!inFrontier[neighbor.index]){
					neighborNode.prev = node
					neighborNode.cost = newCost
					neighborNode.priority =  newCost + relativeEstimate(neighborNode.tile())

					inFrontier[neighbor.index] = frontier.insert(neighborNode.priority, neighborNode)
				}
				else{
					if(newCost < neighborNode.cost){
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

const estimate = (from, to, unit) => {
	if(from.domain === 'land' && to.domain === 'land'){
		return MIN_TERRAIN_COST * tileDistance(from, to);
	}
	if(from.domain === 'sea' && to.domain === 'sea' || to.colony){
		return tileDistance(from, to);
	}

	return MIN_TERRAIN_COST * tileDistance(from, to) + CANNOT_MOVE_COST;
}


// const findReverse = (from, to, unit) => {
// 	const domain = unit.domain;
// 	if(to.isNextToOrDiagonal(from)){
// 		if(to.domain === domain)
// 			return [to];
// 		else
// 			return [];
// 	}
// 	else{
// 		let target = to;
// 		if(unit.domain !== to.domain && !to.colony){
// 			target = findDomainChange(to, unit).pop();
// 		}
// 		let path = findPath(from, target, unit);
// 		if(path){
// 			path.reverse();
// 			path.pop(); //remove last element (this is the current position)

// 			return path;
// 		}

// 		return [];
// 	}
// }


export default {
	initialize,
	findPath,
	findPathXY,
	findHighSeas,
	distance
};