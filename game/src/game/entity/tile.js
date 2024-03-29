import Terrain from 'data/terrain.json'
import MovementCosts from 'data/movementCosts'
import Yield from 'data/yield'
import Goods from 'data/goods'
import Units from 'data/units'

import Util from 'util/util'
import Member from 'util/member'
import Record from 'util/record'
import Binding from 'util/binding'
import LA from 'util/la'
import Message from 'util/message'
import PathFinder from 'util/pathFinder'

import Owner from 'entity/owner'
import MapEntity from 'entity/map'

const BONUS_CHANCE = 0.15
const FOREST_SWITCH_CHANCE = 0.1
const LAND_SWITCH_CHANCE = 0.95
const TERRAIN_NAMES = [
  'tundra',
  'plains',
  'prairie',
  'grassland',
  'savannah',
  'marsh',
  'swamp',
]

const prepare = ({ id, layers, index }) => {
  if (!Object.entries(Terrain).find(([, terrain]) => terrain.id === id)) {
    Message.tile.warn(`No terrain type found for id ${id}.`)
    throw new Error(`No terrain type found for id ${id}.`)
  }

  const { name, terrain } = diversifyTerrain(id)

  return {
    index,
    name,
    terrain,
    layers,
  }
}

const create = ({ index, name, terrain, layers, bonus }) => {
  const tile = {
    index,
    id: terrain.id,
    name,
    terrain,
    bonus,
    domain: Terrain[name].domain,
    forest: layers.top === Terrain.forest.id,
    mountains: layers.top === Terrain.mountains.id,
    riverSmall: layers.riverSmall === Terrain.smallRiver.id,
    riverLarge: layers.riverLarge === Terrain.largeRiver.id,
    mapCoordinates: MapEntity.mapCoordinates(index),
    zone: layers.zone,
    harvestedBy: null,
    plowed: false,
    road: false,
    coast: false,
    coastTerrain: null,
    discoveredBy: [],
    units: [],
  }

  if (tile.domain === 'sea') {
    tile.forest = false
  }
  tile.rumors = tile.domain === 'land' && Math.random() < 0.04
  tile.river = tile.riverLarge || tile.riverSmall

  tile.hills = layers.top === Terrain.hills.id || (tile.mountains && Math.random() > 0.1)
  tile.treeVariation = tile.riverLarge || Math.random() > (tile.river ? 0.3 : 0.9) ? 1 : 0
  tile.mountainVariation =
    (Math.random() > (tile.river ? 0.2 : 0.75) && !tile.bonus) || tile.mountains
  tile.hillVariation = Math.random() > (tile.river ? 0.2 : 0.75) && !tile.bonus

  if (tile.domain === 'land' && !tile.mountains && !tile.hills) {
    tile.forest = diversifyTrees(tile.forest)
  }

  tile.terrainName = terrainName(tile)

  tile.left = () => left(tile)
  tile.up = () => up(tile)
  tile.right = () => right(tile)
  tile.down = () => down(tile)

  tile.discovered = () => discovered(tile)

  Record.addTile(tile)
  return tile
}

const initialize = tile => {
  const updateTreeVariation = colonyOrSettlement => {
    if (colonyOrSettlement) {
      if (tile.forest) {
        tile.treeVariation = 2
      }
    }
    updateTile(tile)
  }

  listen.settlement(tile, updateTreeVariation)
  listen.colony(tile, updateTreeVariation)
}

const diversifyTerrain = originalId => {
  let [name] = Object.entries(Terrain).find(([, terrain]) => terrain.id === originalId)

  if (TERRAIN_NAMES.includes(name)) {
    let terrainIndex = TERRAIN_NAMES.findIndex(x => x == name)
    let chance = LAND_SWITCH_CHANCE
    while (Math.random() < chance) {
      let direction = Math.random() > 0.5 ? 1 : -1

      terrainIndex += direction
      chance *= LAND_SWITCH_CHANCE
    }

    terrainIndex = Util.clamp(terrainIndex, 0, TERRAIN_NAMES.length - 1)
    name = TERRAIN_NAMES[terrainIndex]
  }

  const terrain = Terrain[name]

  return {
    name,
    terrain,
  }
}

const diversifyTrees = trees => (Math.random() < FOREST_SWITCH_CHANCE ? !trees : trees)

const terrainName = tile =>
  tile.forest && tile.domain === 'land'
    ? `${tile.name}WithForest`
    : tile.mountains
      ? 'mountains'
      : tile.hills
        ? 'hills'
        : tile.name

// TODO: Have proper names for terrain
const displayName = tile => terrainName(tile)

const keys = [
  'id',
  'forest',
  'treeVariation',
  'hills',
  'hillVariation',
  'mountains',
  'mountainVariation',
  'riverSmall',
  'riverLarge',
  'bonus',
  'plowed',
  'road',
  'coast',
  'discoveredBy',
  'rumors',
  'harvestedBy',
  'currentlyVisible',
]
const type = [
  'int',
  'bool',
  'int',
  'bool',
  'bool',
  'bool',
  'bool',
  'bool',
  'bool',
  'bool',
  'bool',
  'bool',
  'bool',
  'references',
  'bool',
  'reference',
  'bool',
]
const save = tile =>
  compress([
    tile.id,
    tile.forest,
    tile.treeVariation,
    tile.hills,
    tile.hillVariation,
    tile.mountains,
    tile.mountainVariation,
    tile.riverSmall,
    tile.riverLarge,
    tile.bonus,
    tile.plowed,
    tile.road,
    tile.coast,
    tile.discoveredBy.map(Record.reference),
    tile.rumors,
    Record.reference(tile.harvestedBy),
    tile.currentlyVisible,
  ])

const compress = values =>
  values.map((value, index) => {
    if (type[index] === 'bool') {
      return value ? 1 : 0
    }
    if (type[index] === 'reference') {
      return value ? value[Record.REFERENCE_KEY] : 0
    }
    if (type[index] === 'references') {
      return value.map(one => (one ? one[Record.REFERENCE_KEY] : 0)).join('-')
    }
    return value
  })

export const saveSerializedCopy = tile =>
  compress([
    tile.id,
    tile.forest,
    tile.treeVariation,
    tile.hills,
    tile.hillVariation,
    tile.mountains,
    tile.mountainVariation,
    tile.riverSmall,
    tile.riverLarge,
    tile.bonus,
    tile.plowed,
    tile.road,
    tile.coast,
    tile.discoveredBy,
    tile.rumors,
    tile.harvestedBy,
    tile.currentlyVisible,
  ])

const serializableCopy = tile => ({
  id: tile.id,
  forest: tile.forest,
  treeVariation: tile.treeVariation,
  hills: tile.hills,
  hillVariation: tile.hillVariation,
  mountains: tile.mountains,
  mountainVariation: tile.mountainVariation,
  riverSmall: tile.riverSmall,
  riverLarge: tile.riverLarge,
  bonus: tile.bonus,
  plowed: tile.plowed,
  road: tile.road,
  coast: tile.coast,
  discoveredBy: tile.discoveredBy.map(Record.reference),
  rumors: tile.rumors,
  harvestedBy: Record.reference(tile.harvestedBy),
  currentlyVisible: tile.currentlyVisible,
})

const load = (data, index) => {
  const tile = data
    .map((value, key) => {
      if (type[key] === 'bool') {
        return value === 1
      }
      if (type[key] === 'reference') {
        return value
          ? {
              [Record.REFERENCE_KEY]: value,
            }
          : null
      }
      if (type[key] === 'references') {
        return value
          .split('-')
          .filter(x => x.length > 0)
          .map(one =>
            one
              ? {
                  [Record.REFERENCE_KEY]: Number(one),
                }
              : null
          )
      }
      return value
    })
    .reduce((tile, value, index) => ({ ...tile, [keys[index]]: value }), {})
  tile.index = index
  const [name, terrain] = Object.entries(Terrain).find(([, terrain]) => terrain.id === tile.id)
  if (!terrain) {
    Message.tile.warn(`No terrain type found for id ${tile.id}.`)
    throw new Error(`No terrain type found for id ${tile.id}.`)
  }
  tile.name = name
  tile.terrain = terrain
  tile.domain = Terrain[name].domain
  tile.mapCoordinates = MapEntity.mapCoordinates(tile.index)

  tile.river = tile.riverLarge || tile.riverSmall
  tile.terrainName = terrainName(tile)

  tile.left = () => left(tile)
  tile.up = () => up(tile)
  tile.right = () => right(tile)
  tile.down = () => down(tile)
  tile.discovered = () => tile.currentlyVisible

  tile.units = []

  Record.dereferenceLazy(tile.harvestedBy, entity => update.harvestedBy(tile, entity))

  Record.entitiesLoaded(() => {
    tile.discoveredBy = tile.discoveredBy.map(Record.dereference)
    tile.discovered = () => discovered(tile)

    tile.discoveredBy.forEach(owner =>
      Owner.listen.visible(owner, () => {
        if (tile.currentlyDiscovered !== discovered(tile)) {
          update.currentlyDiscovered(tile, discovered(tile))
          updateTile(tile)
        }
      })
    )

    initialize(tile)
  })

  return tile
}

const discover = (tile, owner) => {
  if (!tile.discoveredBy.includes(owner)) {
    tile.discoveredBy.push(owner)
    Owner.listen.visible(owner, () => {
      if (tile.currentlyDiscovered !== discovered(tile)) {
        update.currentlyDiscovered(tile, discovered(tile))
        updateTile(tile)
      }
    })
  }
}

const discovered = tile => tile.discoveredBy.some(owner => owner.visible)
const neighbors = tile => [left(tile), up(tile), right(tile), down(tile)].filter(n => n)
const diagonalNeighbors = tile => {
  let result = neighbors(tile)
  if (up(tile)) {
    result = result.concat([left(up(tile)), right(up(tile))])
  }
  if (down(tile)) {
    result = result.concat([left(down(tile)), right(down(tile))])
  }
  if (!up(tile) && !down(tile)) {
    Message.tile.warn('tile has no vertical neighbors', tile)
  }
  return result.filter(n => n)
}
const radius = tile => diagonalNeighbors(tile).concat([tile])

const left = tile =>
  MapEntity.tile({
    x: tile.mapCoordinates.x - 1,
    y: tile.mapCoordinates.y,
  })

const up = tile =>
  MapEntity.tile({
    x: tile.mapCoordinates.x,
    y: tile.mapCoordinates.y - 1,
  })

const right = tile =>
  MapEntity.tile({
    x: tile.mapCoordinates.x + 1,
    y: tile.mapCoordinates.y,
  })

const down = tile =>
  MapEntity.tile({
    x: tile.mapCoordinates.x,
    y: tile.mapCoordinates.y + 1,
  })

const isNextTo = (tile, other) => neighbors(tile).includes(other)

const tileMovementCost = (tile, travelType) => {
  if (!tile) {
    console.warn(`Tile is null`)
    return Infinity
  }

  const costTable = MovementCosts[travelType]
  if (!costTable) {
    console.warn(`No Movmentcosts for travelType ${travelType}`)
    return Infinity
  }

  if (tile.domain === 'land' && tile.river && costTable.river) {
    return costTable.river
  }
  if (tile.road && costTable.road) {
    return costTable.road
  }
  if (tile.colony) {
    if (tile.domain === 'sea' && costTable.harbour) {
      return costTable.harbour
    }
    if (tile.domain === 'land' && costTable.colony) {
      return costTable.colony
    }
  }
  if (tile.domain === 'sea' && costTable.ocean) {
    return costTable.ocean
  }

  if (costTable[tile.terrainName]) {
    return costTable[tile.terrainName]
  }

  // Message.tile.warn(`No valid movement cost found for ${unit.properties.travelType} to ${to.terrainName}`)
  return Infinity
}

const unitMovementCost = unit => {
  const tiles = [
    { x: 0, y: 0 },
    { x: 0, y: 1 },
    { x: 1, y: 0 },
    { x: 1, y: 1 },
  ]
    .map(offset => LA.piecewise(LA.add(unit.mapCoordinates, offset), Math.floor))
    .map(coords => ({
      weight:
        (1 - Math.abs(coords.x - unit.mapCoordinates.x)) *
        (1 - Math.abs(coords.y - unit.mapCoordinates.y)),
      cost: tileMovementCost(MapEntity.tile(coords), unit.properties.travelType),
    }))
    .filter(({ cost }) => cost < Infinity)

  return (
    Util.sum(tiles.map(tile => tile.weight * tile.cost)) /
    Util.sum(tiles.map(tile => tile.weight))
  )
}

// TODO: this function is deprecated
const movementCost = (fromCoords, toCoords, unit) => {
  const direction = LA.subtract(toCoords, fromCoords)
  const distance = LA.distanceManhatten(fromCoords, toCoords)
  const normDirection = LA.normalizeManhatten(direction)
  const fromRoundCoords = LA.round(LA.subtract(toCoords, normDirection))
  const from = MapEntity.tile(fromRoundCoords)
  const to = MapEntity.tile(toCoords)
  const costTable = MovementCosts[unit.properties.travelType]
  if (!costTable) {
    console.warn(`No Movmentcosts for travelType ${unit.properties.travelType}`)
  }

  if (!from || !to) {
    console.warn('movementcost not defined', from, to)
    return distance
  }

  // stay in domain with river
  if (
    to.domain === from.domain &&
    to.river &&
    from.river &&
    isNextTo(from, to) &&
    costTable.river
  ) {
    return distance * costTable.river
  }
  // change domain with river
  if (to.river && from.river && isNextTo(from, to) && costTable.river && costTable.ocean) {
    return distance * costTable.river
  }
  if (from.road && to.road && costTable.road) {
    return distance * costTable.road
  }
  if ((to.road || from.road) && costTable.halfRoad) {
    return distance * costTable.halfRoad
  }
  if (to.colony) {
    if (from.domain === 'sea' && costTable.harbour) {
      return distance * costTable.harbour
    }
    if (from.domain === 'land' && costTable.colony) {
      return distance * costTable.colony
    }
  }
  if (to.domain === 'sea' && from.domain === 'sea' && costTable.ocean) {
    return distance * costTable.ocean
  }

  if ((to.domain === from.domain || from.colony) && costTable[to.terrainName]) {
    return distance * costTable[to.terrainName]
  }

  if (costTable['any']) {
    return distance * costTable['any']
  }



  // Message.tile.warn(`No valid movement cost found for ${unit.properties.travelType} to ${to.terrainName}`)
  return Infinity
}

const isPossibleStartLocation = tile =>
  tile.name === 'sea lane' &&
  left(tile) &&
  left(tile).name === 'ocean' &&
  tile.mapCoordinates.y > Record.getGlobal('numTiles').y * 0.15 &&
  tile.mapCoordinates.y < Record.getGlobal('numTiles').y * 0.85

const decideCoastTerrain = tile => {
  if (tile.terrain && tile.terrain.domain === 'sea') {
    const coastalNeighbor = neighbors(tile).find(
      other => other.terrain && other.terrain.domain === 'land'
    )
    tile.coastTerrain = coastalNeighbor ? coastalNeighbor.terrain : null
    if (!tile.coastTerrain) {
      const coastalDiagonalNeighbor = diagonalNeighbors(tile).find(
        other => other.terrain && other.terrain.domain === 'land'
      )
      tile.coastTerrain = coastalDiagonalNeighbor ? coastalDiagonalNeighbor.terrain : null
    }
  }

  if (tile.coastTerrain) {
    tile.coast = true
  }
}

const decideCoastalSea = tile => {
  tile.isCoastalSea =
    tile.terrain &&
    tile.domain === 'sea' &&
    !tile.coast &&
    diagonalNeighbors(tile).some(other => other.coast)
}

const applyModifier = (tile, base, name, resource, where) => {
  const terrainName = tile.terrainName
  if (
    Yield[terrainName] &&
    Yield[terrainName][where] &&
    Yield[terrainName][where][resource] &&
    Yield[terrainName][where][resource][name]
  ) {
    const mod = Yield[terrainName][where][resource][name]

    if (mod[0] === '+') return base + parseFloat(mod.substr(1))
    if (mod[0] === '*') return base * parseFloat(mod.substr(1))

    return mod
  }

  return base
}

const production = (tile, resource, colonist = null) => {
  const where = colonist ? 'field' : 'colony'
  let base = applyModifier(tile, 0, 'base', resource, where)
  if (
    tile.domain === 'sea' &&
    colonist &&
    colonist.colony &&
    !colonist.colony.buildings.harbour.level
  ) {
    base = Math.floor(base / 2)
  }

  if (base > 0 && colonist && colonist.colony) {
    base += colonist.colony.productionBonus
  }

  const modifiers = ['coast', 'plowed', 'river', 'road']
  let result = modifiers.reduce(
    (result, name) =>
      tile[name] ? applyModifier(tile, result, name, resource, where) : result,
    base
  )
  if (tile.bonus) {
    result = applyModifier(tile, result, 'resource', resource, where)
  }
  if (
    colonist?.unit &&
    ((colonist.unit.expert === Goods[resource].expert && tile.domain === 'land') ||
      (colonist.unit.expert === 'fisher' && tile.domain === 'sea'))
  ) {
    result = applyModifier(tile, result, 'expert', resource, where)
  }

  if (result > 0 && colonist?.unit && colonist.unit.expert === 'slave') {
    result -= 1
  }

  if (result > 0 && colonist) {
    result += colonist.productionModifier
  }

  return result
}

const colonyProductionGoods = tile => Object.keys(Yield[tile.terrainName].colony)
const fieldProductionOptions = (tile, colonist) =>
  Goods.types
    .map(good => ({ good, amount: production(tile, good, colonist) }))
    .filter(({ amount }) => amount > 0)

const neighborString = (tile, other) => {
  const result = (c1, c2) => {
    const x1 = c1.x
    const x2 = c2.x
    const y1 = c1.y
    const y2 = c2.y
    if (x1 === x2 && y1 - 1 === y2) return 'up'
    if (x1 + 1 === x2 && y1 - 1 === y2) return 'rightup'
    if (x1 + 1 === x2 && y1 === y2) return 'right'
    if (x1 + 1 === x2 && y1 + 1 === y2) return 'rightdown'
    if (x1 === x2 && y1 + 1 === y2) return 'down'
    if (x1 - 1 === x2 && y1 + 1 === y2) return 'leftdown'
    if (x1 - 1 === x2 && y1 === y2) return 'left'
    if (x1 - 1 === x2 && y1 - 1 === y2) return 'leftup'
  }

  return result(tile.mapCoordinates, other.mapCoordinates)
}

const supportingColony = tile => {
  if (tile.colony) {
    return tile.colony
  }

  if (tile.domain === 'sea') {
    return null
  }

  const supplyUnit = {
    mapCoordinates: tile.mapCoordinates,
    properties: Units.supplytrack,
    domain: tile.domain,
    movement: {
      target: tile,
    },
  }

  return PathFinder.findNearColony(supplyUnit, supplyUnit.properties.range)
}

const area = (tile, travelType) => {
  if (tile.colony && MovementCosts[travelType].harbour) {
    const newTile = diagonalNeighbors(tile).find(neighbor => neighbor.domain !== 'land')
    if (newTile) {
      return area(newTile, travelType)
    }
  }

  return tile.area[travelType]
}

const closest = coords => MapEntity.tile({ x: Math.round(coords.x), y: Math.round(coords.y) })

const description = (tile, owner) => {
  let displayName

  if (tile.discoveredBy.includes(owner)) {
    if (tile.colony) {
      return `${tile.colony.name}`
    } else if (tile.settlement) {
      displayName = `${tile.settlement.tribe.name} village`
    } else {
      if (tile.domain === 'sea') {
        displayName = 'the sea'
      } else {
        if (tile.forest) {
          displayName = 'forest'
        } else if (tile.mountains) {
          displayName = 'mountains'
        } else if (tile.hills) {
          displayName = 'hills'
        } else {
          displayName = 'planes'
        }
      }
    }
  } else {
    displayName = 'undiscovered terrain'
  }

  const measuringUnit = {
    mapCoordinates: tile.mapCoordinates,
    properties: Units.airline,
    domain: tile.domain,
    movement: {
      target: tile,
    },
  }
  const closeColony = PathFinder.findNearColony(measuringUnit)
  if (closeColony) {
    displayName += ` near ${closeColony.name}`
  }

  return displayName
}

const add = {
  unit: (tile, unit) => Member.add(tile, 'units', unit),
}

const update = {
  colony: (tile, colony) => Binding.update(tile, 'colony', colony),
  road: (tile, value) => Binding.update(tile, 'road', value),
  forest: (tile, value) => Binding.update(tile, 'forest', value),
  plowed: (tile, value) => Binding.update(tile, 'plowed', value),
  harvestedBy: (tile, harvestedBy) => Binding.update(tile, 'harvestedBy', harvestedBy),
  settlement: (tile, settlement) => Binding.update(tile, 'settlement', settlement),
  tile: tile => Binding.update(tile),
  currentlyDiscovered: (tile, value) => Binding.update(tile, 'currentlyDiscovered', value),
  // rumors: (tile, value) => Binding.update(tile, 'rumors', value)
}

const listen = {
  tile: (tile, fn) => Binding.listen(tile, null, fn),
  settlement: (tile, fn) => Binding.listen(tile, 'settlement', fn),
  colony: (tile, fn) => Binding.listen(tile, 'colony', fn),
  road: (tile, fn) => Binding.listen(tile, 'road', fn),
  forest: (tile, fn) => Binding.listen(tile, 'forest', fn),
  harvestedBy: (tile, fn) => Binding.listen(tile, 'harvestedBy', fn),
  units: (tile, fn) => Binding.listen(tile, 'units', fn),
  discovered: (tile, fn) => Binding.listen(tile, 'currentlyDiscovered', fn),
  plowed: (tile, fn) => Binding.listen(tile, 'plowed', fn),
}

const clearForest = tile => {
  update.forest(tile, false)
  tile.bonus = Math.random() < BONUS_CHANCE
  tile.terrainName = terrainName(tile)

  updateTile(tile)
}

const plow = tile => {
  update.plowed(tile, true)

  updateTile(tile)
}

const constructRoad = tile => {
  update.road(tile, true)
  updateTile(tile)
}

const removeRoad = tile => {
  update.road(tile, false)
  updateTile(tile)
}

const updateRumors = (tile, value) => {
  tile.rumors = value

  updateTile(tile)
}

const updateTile = center => {
  radius(center).forEach(update.tile)
}

const get = coords => MapEntity.tile(coords)

export default {
  initialize,
  prepare,
  create,
  discover,
  isNextTo,
  production,
  description,
  update,
  isPossibleStartLocation,
  colonyProductionGoods,
  fieldProductionOptions,
  decideCoastTerrain,
  decideCoastalSea,
  diagonalNeighbors,
  radius,
  movementCost,
  unitMovementCost,
  tileMovementCost,
  save,
  load,
  neighborString,
  updateRumors,
  clearForest,
  plow,
  constructRoad,
  removeRoad,
  listen,
  left,
  right,
  up,
  down,
  add,
  closest,
  get,
  area,
  serializableCopy,
  displayName,
  supportingColony,
  TERRAIN_NAMES,
  BONUS_CHANCE,
}
