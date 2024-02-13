import { FibonacciHeap } from '@tyriar/fibonacci-heap'
import MovementCosts from 'data/movementCosts'
import Units from 'data/units'

import Util from 'util/util'
import Message from 'util/message'
import LA from 'util/la'
import Cache from 'util/cache'

import Time from 'timeline/time'

import MapEntity from 'entity/map'
import Tile from 'entity/tile'
import Unit from 'entity/unit'

const CANNOT_MOVE_COST = 500

const tile = (...args) => MapEntity.tile(...args)

const caching = {
  keyFn: (coords1, coords2, unit) =>
    `${coords1.x}x${coords1.y}x${coords2.x}x${coords2.y}x${unit.domain}`,
  initFn: wipeCache => {
    MapEntity.get()
      .tiles.filter(tile => tile.domain === 'land')
      .forEach(tile => {
        Tile.listen.road(tile, () => {
          wipeCache(key => key.indexOf('xsea') >= 0)
        })
        Tile.listen.forest(tile, () => {
          wipeCache(key => key.indexOf('xsea') >= 0)
        })
        Tile.listen.colony(tile, () => wipeCache())
      })
  },
}

const allNeighbors = ({ x, y }) =>
  tile({ x, y })
    ? Tile.diagonalNeighbors(tile({ x, y }))
    : [
        tile({
          x: Math.ceil(x - 1),
          y: Math.ceil(y - 1),
        }),
        tile({
          x: Math.round(x),
          y: Math.ceil(y - 1),
        }),
        tile({
          x: Math.floor(x + 1),
          y: Math.ceil(y - 1),
        }),
        tile({
          x: Math.ceil(x - 1),
          y: Math.round(y),
        }),
        tile({
          x: Math.floor(x + 1),
          y: Math.round(y),
        }),
        tile({
          x: Math.ceil(x - 1),
          y: Math.floor(y + 1),
        }),
        tile({
          x: Math.round(x),
          y: Math.floor(y + 1),
        }),
        tile({
          x: Math.floor(x + 1),
          y: Math.floor(y + 1),
        }),
      ].filter(Util.unique)

const getNeighborsForUnit = unit => node =>
  allNeighbors(node.coords)
    .filter(
      tile =>
        Tile.area(tile, unit.properties.travelType) === Unit.area(unit) ||
        tile.colony ||
        unit.properties.travelType === 'airline'
    )
    .filter(tile => unit.properties.canExplore || tile.discoveredBy.includes(unit.owner))
    .map(tile => tile.mapCoordinates)
const getAllNeighbors = () => node =>
  allNeighbors(node.coords).map(tile => tile.mapCoordinates)
const getNeighborsForSupply = () => node =>
  allNeighbors(node.coords)
    .filter(tile => tile.road || tile.colony)
    .map(tile => tile.mapCoordinates)
const getNeighborsForTravelType = (tile, travelType) =>
  allNeighbors(tile.mapCoordinates).filter(
    other =>
      Tile.movementCost(tile.mapCoordinates, other.mapCoordinates, {
        properties: { travelType },
      }) !== Infinity
  )

const getCostForUnit = unit => (n1, n2) => Tile.movementCost(n1.coords, n2.coords, unit)
const mapToCoords = path => path.map(node => node.coords)
const reduceToDistance = path => path[path.length - 1].cost

const findNextToArea = (toCoords, unit) => {
  // searching backwards
  const unitArea = Unit.area(unit)
  const isTarget = node =>
    tile(node.coords) && tile(node.coords).area[unit.properties.travelType] === unitArea

  // use airline travel to find the shortest way
  const measuringUnit = {
    properties: Units.airline,
  }

  const path = runDijksrta(
    toCoords,
    isTarget,
    getAllNeighbors(),
    getCostForUnit(measuringUnit),
    relativeEstimate()
  )

  return path && path.length > 0 && path[path.length - 1].coords
}

const findHighSeas = (fromCoords, unit) => {
  const isTarget = node => tile(node.coords) && tile(node.coords).terrainName === 'sea lane'

  return mapToCoords(
    runDijksrta(
      fromCoords,
      isTarget,
      getNeighborsForUnit(unit),
      getCostForUnit(unit),
      relativeEstimate()
    )
  )
}

const findPath = Cache.create({
  ...caching,
  name: 'path cache',
  shouldCache: (result, coords1, coords2, unit) => unit.domain === 'sea',
  valueFn: (fromCoords, toCoords, unit) => {
    const area = Unit.area(unit)
    const target = MapEntity.tile(toCoords)
    if (!target) {
      Message.unit.warn('toCoords must resolve to a tile')
      return null
    }

    if (Tile.area(target, unit.properties.travelType) !== area) {
      const newCoords = findNextToArea(toCoords, unit)
      if (newCoords) {
        return findPath(fromCoords, newCoords, unit)
      }
      Message.unit.warn('could not find path to target area')
      return null
    }

    const isTarget = node => tile(node.coords) && tile(node.coords) === target

    const path = runDijksrta(
      fromCoords,
      isTarget,
      getNeighborsForUnit(unit),
      getCostForUnit(unit),
      relativeEstimate(fromCoords, toCoords, unit)
    )

    return mapToCoords(path)
  },
})

const NEAR_COLONY_COST = 4
const findNearColony = Cache.create({
  name: 'nearest colony cache',
  keyFn: unit =>
    `${unit.mapCoordinates.x}x${unit.mapCoordinates.y}x${unit.properties.travelType}`,
  initFn: wipeCache => {
    MapEntity.get()
      .tiles.filter(tile => tile.domain === 'land')
      .forEach(tile => {
        Tile.listen.road(tile, () => wipeCache(key => key.indexOf('xairline') > 0))
        Tile.listen.colony(tile, () => wipeCache())
      })
  },
  valueFn: (unit, maxCost = NEAR_COLONY_COST) => {
    const isTarget = node =>
      node.cost > maxCost || (tile(node.coords) && tile(node.coords).colony)

    let neighborsFn = getNeighborsForUnit(unit)
    if (unit.properties.travelType === 'supply') {
      neighborsFn = getNeighborsForSupply()
    }
    if (unit.properties.travelType === 'airline') {
      neighborsFn = getAllNeighbors()
    }
    const result = runDijksrta(
      unit.mapCoordinates,
      isTarget,
      neighborsFn,
      getCostForUnit(unit),
      relativeEstimate()
    ).pop()

    return tile(result.coords) && tile(result.coords).colony
  },
})

const distance = Cache.create({
  ...caching,
  name: 'distance cache',
  valueFn: (fromCoords, toCoords, unit, max = CANNOT_MOVE_COST) => {
    const isTarget = node =>
      node.cost > max || (tile(node.coords) && tile(node.coords) === tile(toCoords))

    return reduceToDistance(
      runDijksrta(
        fromCoords,
        isTarget,
        getNeighborsForUnit(unit),
        getCostForUnit(unit),
        relativeEstimate(fromCoords, toCoords, unit)
      )
    )
  },
})

const distanceToEurope = (coords, unit) => {
  // TODO: Calculate this properly with find high seas
  if (unit.domain !== 'sea') {
    return CANNOT_MOVE_COST
  }
  return (unit.properties.speed * Time.EUROPE_SAIL_TIME) / Time.MOVE_BASE_TIME
}

const relativeEstimate = (startCoords, targetCoords, unit) => coords =>
  startCoords && targetCoords && unit
    ? estimate(coords, targetCoords, unit.properties.travelType) -
      estimate(startCoords, targetCoords, unit.properties.travelType)
    : 0

const MIN_COST_TABLE = Object.entries(MovementCosts).reduce(
  (obj, [type, costs]) => ({
    ...obj,
    [type]: Util.min(Object.values(costs)),
  }),
  {}
)
const estimate = (v, w, travelType) => {
  return MIN_COST_TABLE[travelType] * LA.distanceManhatten(v, w)
}

const initialize = () => {}

const createHeap = () =>
  new FibonacciHeap((a, b) => {
    //comparison by used cost
    if (a.key !== b.key) return a.key - b.key

    if (!a.value || !b.value) {
      return 0
    }

    if (a.value.cost !== b.value.cost) return a.value.cost - b.value.cost

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
    while (node.prev !== node) {
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

  return [{ coords: startCoordinates, prev: null, cost: 0 }]
}

export default {
  initialize,
  findPath,
  findHighSeas,
  findNearColony,
  distance,
  distanceToEurope,
  getNeighborsForTravelType,
}
