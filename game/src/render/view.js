import Util from 'util/util'
import Record from 'util/record'
import Binding from 'util/binding'
import Events from 'util/events'

import Tile from 'entity/tile'
import MapEntity from 'entity/map'

import Background from 'render/background'
import Foreground from 'render/foreground'
import AssembleMap from 'render/background/assemble'

const get = () => ({
  scale: Record.getGlobal('scale'),
  coords: Record.getGlobal('coords'),
})

let resizeFunctions = []

const restart = () => {
  AssembleMap.initialize()
  let { scale, coords } = get()

  if (!scale) {
    console.warn('No map scale found, set to 1')
    scale = 1
  }

  if (!coords) {
    console.warn('No map view coords found, setting reasonable default coordinates')
    const colony = Record.getAll('colony')[0]
    if (colony) {
      coords = {
        ...colony.mapCoordinates
      }
    } else {
      const unit = Record.getAll('unit')[0]
      if (unit) {
        coords = {
          ...unit.mapCoordinates
        }
      } else {
        coords = Util.choose(
          MapEntity.get().tiles.filter(Tile.isPossibleStartLocation)
        ).mapCoordinates
      }
    }
  }

  updateScale(scale)
  updateMapCoords(coords)
  Background.restart()
}

const getDimensions = () => ({
  x: Background.get().layer.width,
  y: Background.get().layer.height,
})

const getCenter = () => ({
  x: Background.get().layer.width / 2,
  y: Background.get().layer.height / 2,
})

const updateMapCoords = (inputCoords) => {
  const sanitizedCoords = inputCoords ?? Record.getGlobal('coords')
  if (sanitizedCoords) {
    const { x, y } = sanitizedCoords
    const coords = { x: Math.round(x), y: Math.round(y) }
    Record.setGlobal('coords', coords)
    Foreground.updateCoords(coords)
    Background.updateCoords(coords)
  } else {
    console.error('updateMapCoords called with invalid coords, unable to recover:', inputCoords, Record.getGlobal('coords'))
  }
}

const updateScale = newScale => {
  Record.setGlobal('scale', newScale)
  Foreground.updateScale(newScale)
  Background.updateScale(newScale)
}

const initialize = () => {
  Record.setGlobal('scale', 1)
  Record.setGlobal('coords', {
    x: 0,
    y: 0,
  })

  Background.initialize()
  Foreground.initialize()
  // TODO: clean this up and use the binding system all the way through
  updateWhenResized(({ dimensions }) => update.dimensions(dimensions))
  window.addEventListener('resize', () =>
    resizeFunctions.forEach(fn =>
      fn({
        dimensions: getDimensions(),
        scale: Record.getGlobal('scale'),
        coords: Record.getGlobal('coords'),
      })
    )
  )

  Events.listen('restart', () => {
    restart()
  })
}

const onDraw = () => {
  Background.doRenderWork()
  Foreground.doRenderWork()
}

const state = {
  dimensions: null,
  scale: null,
  coords: null,
}

const listen = {
  dimensions: fn => Binding.listen(state, 'dimensions', fn),
}

const update = {
  dimensions: value => Binding.update(state, 'dimensions', value),
}

const updateWhenResized = fn => {
  fn({
    dimensions: getDimensions(),
    scale: Record.getGlobal('scale'),
    coords: Record.getGlobal('coords'),
  })
  resizeFunctions.push(fn)
  return () => (resizeFunctions = resizeFunctions.filter(func => func !== fn))
}

const render = () => {
  Background.render()
}

export default {
  updateMapCoords,
  updateScale,
  getDimensions,
  updateWhenResized,
  getCenter,
  initialize,
  restart,
  onDraw,
  render,
  listen,
  get,
}
