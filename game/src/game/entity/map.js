import MovementCosts from 'data/movementCosts'

import Record from 'util/record'
import Util from 'util/util'
import Message from 'util/message'
import PathFinder from 'util/pathFinder'

import Tile from 'entity/tile.js'
import Owner from 'entity/owner'

let numTiles = null
let tiles = null

const layer = (data, name) => data.layers.find(layer => layer.name === name)

const createCoastLine = tiles => {
  //look for coasts and create coast lines
  tiles.forEach(Tile.decideCoastTerrain)
  tiles.forEach(Tile.decideCoastalSea)
}

const TRAVEL_TYPES = Object.keys(MovementCosts).filter(
  type => !['airline', 'supply'].includes(type)
)
const createAllAreas = tiles => {
  TRAVEL_TYPES.forEach(travelType => createAreas(tiles, travelType))
}
const createAreas = (tiles, travelType) => {
  let currentArea = 1
  const markArea = tile => {
    if (!tile.area) {
      tile.area = {}
    }
    tile.area[travelType] = currentArea
    let neighbors = PathFinder.getNeighborsForTravelType(tile, travelType).filter(
      neighbor => !neighbor.area || !neighbor.area[travelType]
    )
    while (neighbors.length > 0) {
      neighbors.forEach(n => {
        if (!n.area) {
          n.area = {}
        }
        n.area[travelType] = currentArea
      })
      neighbors = neighbors
        .map(n =>
          PathFinder.getNeighborsForTravelType(n, travelType).filter(
            neighbor => !neighbor.area || !neighbor.area[travelType]
          )
        )
        .flat()
        .filter(Util.unique)
    }
  }
  tiles.forEach(tile => {
    if (!tile.area || !tile.area[travelType]) {
      markArea(tile)
      currentArea += 1
    }
  })

  Message.initialize.log(`Found ${currentArea - 1} seperate areas for ${travelType}`)
}

const get = () => ({
  numTiles,
  tiles,
})

const create = ({ data }) => {
  Message.initialize.log('Creating map')

  const baseLayer = layer(data, 'terrain base')
  numTiles = {
    x: baseLayer.width,
    y: baseLayer.height,
  }
  numTiles.total = numTiles.x * numTiles.y

  Message.initialize.log('Creating tiles')
  const preparedTiles = layer(data, 'terrain base').data.map((id, index) =>
    Tile.prepare({
      id,
      index,
      layers: {
        top: layer(data, 'terrain top').data[index],
        riverSmall: layer(data, 'terrain river small').data[index],
        riverLarge: layer(data, 'terrain river large').data[index],
        zone: layer(data, 'zones').data[index],
      },
    })
  )

  const findRelevantTiles = (tilesScope, tile, range) => {
    const index = (x, y) => Math.round(x + y * numTiles.x) % numTiles.total
    const tileCoords = mapCoordinates(tile.index)

    const outerProduct = list => list.map(item1 => list.map(item2 => [item1, item2]))

    const baseList = [0]
      .concat(Util.range(range).map(x => x + 1))
      .concat(Util.range(range).map(x => -x - 1))
    return outerProduct(baseList)
      .flat()
      .map(([dx, dy]) => tilesScope[index(tileCoords.x + dx, tileCoords.y + dy)])
      .filter(other => !!other)
  }

  const medianTiles = preparedTiles.map(tile => {
    const bonus =
      Math.random() < Tile.BONUS_CHANCE && tile.name !== 'sea lane' && tile.name !== 'ocean'
    if (!Tile.TERRAIN_NAMES.includes(tile.name)) {
      return {
        ...tile,
        bonus,
      }
    }

    const relevantTiles = findRelevantTiles(preparedTiles, tile, 3)

    const sorted = relevantTiles
      .filter(someTile => Tile.TERRAIN_NAMES.includes(someTile.name))
      .sort(
        (tileA, tileB) =>
          Tile.TERRAIN_NAMES.indexOf(tileA.name) - Tile.TERRAIN_NAMES.indexOf(tileB.name)
      )

    if (sorted.length > 0) {
      return {
        ...sorted[Math.floor(sorted.length / 2)],
        layers: tile.layers,
        index: tile.index,
        bonus,
      }
    }

    return {
      ...tile,
      bonus,
    }
  })

  const bonusTiles = medianTiles
  tiles = bonusTiles.map(Tile.create)
  tiles.forEach(Tile.initialize)
  Message.initialize.log('Creating coast line')
  createCoastLine(tiles)
  createAllAreas(tiles)
  Message.initialize.log('Map created')

  Record.setGlobal('numTiles', numTiles)
}

const discoverAll = () => {
  tiles.forEach(tile => Tile.discover(tile, Owner.player()))
}

const tileFromIndex = index => tiles[index]
const tile = ({ x, y }) =>
  x >= 0 && x < numTiles.x && y >= 0 && y < numTiles.y ? tiles[y * numTiles.x + x] : null
const mapCoordinates = index => ({
  x: index % numTiles.x,
  y: Math.floor(index / numTiles.x),
})

const save = ({ numTiles }) => ({
  numTiles,
})

const prepare = () => {
  numTiles = Record.getGlobal('numTiles')
}

const load = () => {
  Message.initialize.log('Loading map...')
  tiles = Util.range(numTiles.x * numTiles.y)
    .map(index => Record.referenceTile({ index }))
    .map(Record.dereferenceTile)

  createCoastLine(tiles)
  createAllAreas(tiles)

  return { numTiles, tiles }
}

export default {
  create,
  tileFromIndex,
  discoverAll,
  get,
  tile,
  save,
  load,
  prepare,
  mapCoordinates,
}
