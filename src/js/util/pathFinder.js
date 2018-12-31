import Graph from '../util/graph';
import Util from '../util/util'
import { FibonacciHeap } from '@tyriar/fibonacci-heap';

const UNDISCOVERED_COST = 5
const CANNOT_MOVE_COST = 500
const graph = Graph.create()
let mapEntity = null


const initialize = (map) => {
	mapEntity = map
	const isInnerTile = center =>
		center.up() &&
		center.left() &&
		center.down() &&
		center.right() &&
		center.up().left() &&
		center.up().right() &&
		center.down().left() &&
		center.down().right()

	Util.range(map.numTiles.total).forEach(index => {
		const center = map.tiles[index]
		const neighbors = center.diagonalNeighbors().map(tile => ({
			index: tile.index,
			cost: tile.movementCost(center),
			tile
		}))

		graph.addNode({
			index: center.index,
			tile: center
		}, neighbors);
	})
}

const findDomainChange = from => {
	const target = node => node.tile.domain !== from.domain
	return find(from, target, null, true);
}

const findPathXY = (from, to) => {
	const fromTile = mapEntity.tile(from.x, from.y)
	const toTile = mapEntity.tile(to.x, to.y)
	return findPath(fromTile, toTile)	
}


const findPath = (from, to) => {
	const target = node => node.index === to.index
	return find(from, target, to, false)
}

const	tileDistance = (from, to) => {
	const pos1 = from.mapCoordinates
	const pos2 = to.mapCoordinates
	return Math.max(Math.abs(pos1.x - pos2.x), Math.abs(pos1.y - pos2.y))
}


const find = (from, isTarget, target, freeDomainCross) => {
	const frontier = new FibonacciHeap((a, b) => {
		//comparison by used cost
		if(a.key !== b.key)
			return a.key - b.key;

		//comparison by actual cost
		if(a.value.cost !== b.value.cost)
			return a.value.cost - b.value.cost;

		//prefer horizontal or vertical movement to diagonals
		if(a.value.prev.value.tile.isNextTo(a.value.tile))
			return -1;

		if(b.value.prev.value.tile.isNextTo(b.value.tile))
			return 1;

		return 0;
	});

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
		if(isTarget(node.value)){
			const path = [node.value.tile]
			while(node.value.prev !== node){
				node = node.value.prev
				path.push(node.value.tile)
			}

			return path.reverse()
		}

		explored[node.value.index] = true
		node.value.neighbors.forEach(neighbor => {
			if(!explored[neighbor.index]){
				let neighborNode = graph.node(neighbor.index)
				let newCost = node.value.cost + neighbor.cost
				if(neighborNode.tile.domain !== node.value.tile.domain){
					if(freeDomainCross)
						newCost = 0
					else
						newCost += CANNOT_MOVE_COST
				}


				if(!inFrontier[neighbor.index]){
					neighborNode.prev = node
					neighborNode.cost = newCost
					neighborNode.priority =  newCost + relativeEstimate(neighborNode.tile)

					inFrontier[neighbor.index] = frontier.insert(neighborNode.priority, neighborNode)
				}
				else{
					if(newCost < neighborNode.cost){
						neighborNode.prev = node
						neighborNode.cost = newCost
						neighborNode.priority = newCost + relativeEstimate(neighborNode.tile)

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
	if(from.domain === 'land' && to.domain === 'land'){
		return 0.33 * tileDistance(from, to);
	}
	if(from.domain === 'sea' && to.domain === 'sea'){
		return tileDistance(from, to);
	}

	return 0.33* tileDistance(from, to) + CANNOT_MOVE_COST;
}


const findReverse = (from, to, unit) => {
	const domain = unit.domain;
	if(to.isNextToOrDiagonal(from)){
		if(to.domain === domain)
			return [to];
		else
			return [];
	}
	else{
		let target = to;
		if(from.domain !== to.domain){
			target = findDomainChange(to, unit).pop();
		}
		let path = findPath(from, target, unit);
		if(path){
			path.reverse();
			path.pop(); //remove last element (this is the current position)

			return path;
		}

		return [];
	}
}


export default {
	initialize,
	findPath,
	findPathXY
};