import * as PIXI from 'pixi.js'
import Message from 'util/message'

const paths = Object.freeze({
  // icons, units, colonists, resources, etc
  map: 'images/map.png',

  // map
  mapWithMargin: 'images/map/tilesWithMargin.png', // used for map background
  undiscovered: 'images/map/undiscovered.jpg',

  // used for colony display
  colonyBackground: 'images/colony_triangle_pack/colony_background.png',
  triangles: 'images/colony_triangle_pack/first_version_4k.png',
  prod_compl_church_tabacco_education_cloth_4k: 'images/colony_triangle_pack/prod_compl_church_tabacco_education_cloth_4k.png',
  prod_compl_townhall_carpenter_4k: 'images/colony_triangle_pack/prod_compl_townhall_carpenter_4k.png',

  // europe full screen
  europeBackground: 'images/europe/background.jpg',
  goodsBackground: 'images/europe/goods-background.jpg',

  // ui elements
  ring: 'images/ui/ring.png', // ui element used in production selection
  status: 'images/ui/status.png', // used as button in europe, should be deprecated

  // the help screen is deprecated, but still in the code
  help: 'images/deprecated/help.jpg',

  // full screen events (should be moved to solid-ui)
  discovery: 'images/fullscreen-events/discovery.jpg',
  firstColony: 'images/fullscreen-events/first-colony.jpg',
  enteringVillage: 'images/fullscreen-events/entering-village.jpg',
  firstFreight: 'images/fullscreen-events/first-freight.jpg',

  // should be deprecated but still in the code
  tutorialFrame: 'images/deprecated/tutorial-frame.png',
})

const textures = {
  white: PIXI.Texture.WHITE,
}

const resolution = {
  prod_compl_church_tabacco_education_cloth_4k: 2.0,
  prod_compl_townhall_carpenter_4k: 2.0,
}

const getResolution = name => {
  if (name in resolution) {
    return resolution[name]
  }

  return 1.0
}

const videos = {
  colony: 'videos/tutorial/colony.mp4',
  equip: 'videos/tutorial/equip.mp4',
  foundColony: 'videos/tutorial/found-colony.mp4',
  goEurope: 'videos/tutorial/go-europe.mp4',
  inEurope: 'videos/tutorial/in-europe.mp4',
  landfall: 'videos/tutorial/landfall.mp4',
  move: 'videos/tutorial/move.mp4',
  pioneer: 'videos/tutorial/pioneer.mp4',
  drag: 'videos/tutorial/drag.mp4',
  select: 'videos/tutorial/select.mp4',
  zoom: 'videos/tutorial/zoom.mp4',
}

const offset = 2
let counter = offset

const logDownloadProgress = (loader, resource) => {
  counter += 1
  Message.initialize.log(`Downloading assets (${counter}/${numberOfAssets()})...`)
}

const loadTexture = async path => {
  const texture = await PIXI.Assets.load(path)
  logDownloadProgress()
  return texture
}

const numberOfAssets = () => offset + Object.keys(paths).length

const rectangle = (index, margin = 0) => {
  const width = 64
  const height = 64
  const tilesPerRow = Math.floor(1024 / width)
  const row = Math.floor(index / tilesPerRow)
  const col = index % tilesPerRow
  return new PIXI.Rectangle((width + 2*margin) * col + margin, (height + 2*margin) * row + margin, width, height)
}

const texture = (name, options = {}) => {
  if (!textures[name]) {
    Message.initialize.warn('Texture not found in textures:', name, textures)
    return textures.white
  }
  if (options.frame || options.frame === 0) {
    const margin = name === 'mapWithMargin' ? 2 : 0
    return new PIXI.Texture(textures[name], rectangle(options.frame, margin))
  }
  if (options.rectangle) {
    return new PIXI.Texture(textures[name], options.rectangle)
  }
  return textures[name]
}

const video = name => {
  if (!textures[name]) {
    textures[name] = PIXI.Texture.from(videos[name])
  }
  return sprite(name)
}

const sprite = (name, options) => new PIXI.Sprite(texture(name, options))

let loadAllPromise = null

const loadAll = () => {
  if (!loadAllPromise) {
    loadAllPromise = Promise.all(
      Object.keys(paths).map(async key => {
        const path = paths[key]
        textures[key] = await loadTexture('/' + path)
        if (key in resolution) {
          // textures[key].baseTexture.resolution = resolution[key]
        }
      })
    )
  }

  return loadAllPromise
}

const initialize = () => {
  return loadAll()
}

export default {
  initialize,
  video,
  sprite,
  texture,
  getResolution,
  rectangle,
  paths,
  numberOfAssets,
}
