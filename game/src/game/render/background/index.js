import * as PIXI from 'pixi.js'

import Util from 'util/util'

import Layer from 'render/layer'
import RenderView from 'render/view'
import Resources from 'render/resources'

import Message from 'util/message'

import MapEntity from 'entity/map'
import Tile from 'entity/tile'

import AssembleMap from './assemble'
import TileCache from './tileCache'

const MAX_TILES = 30000

let numTiles = null
let layer = null
let containers = []
let undiscovered = null
let tiles = null
let scale = 1
let renderRequested = false
let visible = true

const get = () => ({
  numTiles,
  layer,
  containers,
  undiscovered,
  tiles,
  renderRequested,
})

const updateCoords = ({ x, y }) => {
  containers.forEach(container => {
    container.x = x
    container.y = y
  })
  undiscovered.tilePosition.x = x
  undiscovered.tilePosition.y = y
  render()
}

const updateScale = newScale => {
  containers.forEach(container => {
    container.scale.set(newScale, newScale)
  })
  undiscovered.tileScale.set(newScale, newScale)
  scale = newScale
  render()
}

const getContainer = index => {
  while (containers.length <= index) {
    const container = new PIXI.ParticleContainer(MAX_TILES, {
      tint: true,
    })
    if (containers.length > 0) {
      container.x = containers[containers.length - 1].x
      container.y = containers[containers.length - 1].y
      container.scale.set(scale, scale)
    } else {
      updateScale(RenderView.get().scale)
      updateCoords(RenderView.get().coords)
    }
    layer.app.stage.addChild(container)
    containers.push(container)
  }

  return containers[index]
}

const hide = () => {
  if (visible) {
    visible = false
    render()
  }
}

const show = () => {
  if (!visible) {
    visible = true
    render()
  }
}

const createSpriteFromFrames = (resource, frames) =>
  frames.map(frame => {
    const sprite = Resources.sprite(resource, {
      frame: Math.abs(frame) - 1,
    })
    sprite.blendMode = frame > 0 ? PIXI.BLEND_MODES.NORMAL : PIXI.BLEND_MODES.OVERLAY
    return sprite
  })

const mapName = 'map'
const createSprite = frames => {
  return createSpriteFromFrames(mapName, frames)
}
const createSpritesFromTile = tile =>
  createSpriteFromFrames(mapName, AssembleMap.assembleTile(tile))

const createTiles = tileStacks =>
  tileStacks.map((stack, index) => ({
    index,
    spites: null,
    stack,
    container: null,
    initialized: false,
    createCachedSprites: () => {
      const result = TileCache.createCachedSprite(createSprite, stack.frames)
      // console.log('created cached sprites', stack, result)
      if (result) {
        result.position.x = stack.position.x
        result.position.y = stack.position.y

        return [result]
      }

      // if we have no cache
      const sprites = createSprite(stack.frames)
      sprites.forEach(sprite => {
        sprite.position.x = stack.position.x
        sprite.position.y = stack.position.y
      })
      return sprites
    },
    update: (tile, coords) => {
      if (tile.initialized) {
        if (tile.dirty) {
          const newStack = AssembleMap.assembleTileXY(coords)
          if (
            newStack.length !== tile.stack.frames.length ||
            !newStack.every((frame, i) => frame === tile.stack.frames[i])
          ) {
            tile.stack.frames = newStack
            tile.initialized = false
          } else {
            tile.dirty = false
          }
        }
      } else {
        tile.stack.frames = AssembleMap.assembleTileXY(coords)
        tile.initialized = false
      }
    },
    initialize: tile => {
      tile.sprites = tile.createCachedSprites()
      tile.container = getContainer(TileCache.getTextureIndex(tile.stack.frames) ?? 0)
      tile.initialized = true
      tile.dirty = false
    },
  }))

let unsubscribeTiles = () => {}
const restart = () => {
  Message.initialize.log('Reassembling tiles')
  tiles = createTiles(AssembleMap.getTileStacks())
  numTiles = AssembleMap.getNumTiles()

  Util.execute(unsubscribeTiles)
  unsubscribeTiles = tiles.map((tile, index) =>
    Tile.listen.tile(MapEntity.get().tiles[index], () => {
      tile.dirty = true
      render()
    })
  )

  render()
}

const initialize = () => {
  layer = new Layer({
    transparent: true,
    clearBeforeRender: false,
    preserveDrawingBuffer: true,
  })

  TileCache.initialize(layer.app.renderer)

  undiscovered = new PIXI.TilingSprite(
    Resources.texture('undiscovered'),
    layer.width,
    layer.height
  )

  layer.app.stage.addChild(undiscovered)
  layer.app.stop()

  if (AssembleMap.isReady()) {
    Message.initialize.log('Assembling tiles')
    tiles = createTiles(AssembleMap.getTileStacks())
    numTiles = AssembleMap.getNumTiles()

    Util.execute(unsubscribeTiles)
    unsubscribeTiles = tiles.map((tile, index) =>
      Tile.listen.tile(MapEntity.get().tiles[index], () => {
        tile.dirty = true
        render()
      })
    )

    render()
  }

  window.addEventListener('resize', resize)
}

const resize = () => {
  undiscovered.width = layer.width
  undiscovered.height = layer.height
  render()
}

const render = () => {
  renderRequested = true
}

const doRenderWork = () => {
  if (!renderRequested || !visible) {
    return
  }

  containers.forEach(container => {
    container.removeChildren()
  })

  const numTilesX = Math.ceil(layer.width / 64 / scale) + 1
  const numTilesY = Math.ceil(layer.height / 64 / scale) + 1
  const offsetX = -Math.ceil(undiscovered.tilePosition.x / 64 / scale)
  const offsetY = -Math.ceil(undiscovered.tilePosition.y / 64 / scale)

  const xIndices = Util.range(numTilesX)
    .map(x => x + offsetX)
    .filter(x => x >= 0 && x < numTiles.x)
  const yIndices = Util.range(numTilesY)
    .map(y => y + offsetY)
    .filter(y => y >= 0 && y < numTiles.y)

  xIndices.forEach(x => {
    yIndices.forEach(y => {
      const index = y * numTiles.x + x
      const coords = { x, y }

      tiles[index].update(tiles[index], coords)
      if (!tiles[index].initialized) {
        tiles[index].initialize(tiles[index])
      }
      tiles[index].sprites.forEach(sprite => {
        sprite.tint = AssembleMap.tintXY(coords)
        tiles[index].container.addChild(sprite)
      })
    })
  })

  layer.app.render()
  renderRequested = false
}

export default {
  initialize,
  restart,
  render,
  hide,
  show,
  doRenderWork,
  updateCoords,
  updateScale,
  createSpritesFromTile,
  get,
}
