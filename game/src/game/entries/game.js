import Version from 'version/version'

import americaLargeMap from 'maps/america-large'

import Tween from 'util/tween.js'
import PathFinder from 'util/pathFinder'
import Record from 'util/record'
import Util from 'util/util'
import Error from 'util/error'
import Message from 'util/message'
import Savegame from 'util/savegame'

import Time from 'timeline/time'

import MapEntity from 'entity/map.js'
import Unit from 'entity/unit'
import Europe from 'entity/europe'
import Market from 'entity/market'
import Tribe from 'entity/tribe'
import Owner from 'entity/owner'
import Treasure from 'entity/treasure'
import Tile from 'entity/tile'

import Meet from 'task/unit/meet'

import Input from 'input'

import Resources from 'render/resources'
import RenderView from 'render/view'
import Foreground from 'render/foreground'
import Background from 'render/background'
import AssmebleMap from 'render/background/assemble'

import MapView from 'view/map'
import AutosaveView from 'view/autosave'
import FullscreenEvents from 'view/fullscreenEvents'
import UnitMapView from 'view/map/unit'

import Dialog from 'view/ui/dialog'
import Overlay from 'ui/overlay'

const RESUME_GAME_PAUSED = false
const AUTOSAVE_INTERVAL = 5 * 60 * 1000 // autosave every 5 minutes
// const AUTOSAVE_INTERVAL = 30 * 1000 // autosave every 30 seconds
const initialize = () => {
  let timeStamp = 0
  setInterval(Savegame.autosave, AUTOSAVE_INTERVAL)

  Time.schedule(Meet.create())

  const loop = t => {
    const deltaTime = Math.min(t - timeStamp, 150)
    timeStamp = t
    try {
      Time.advance(deltaTime)
    } catch (err) {
      Error.capture(err)
    }

    try {
      RenderView.onDraw()
    } catch (err) {
      Error.capture(err)
    }
    requestAnimationFrame(loop)
  }

  requestAnimationFrame(t => {
    timeStamp = t
    requestAnimationFrame(loop)
  })
}

// const americaSmall = () => {
// 	const startCoordinates = Util.choose([
// 		{ x: 135, y: 82 },
// 		{ x: 152, y: 105 },
// 		{ x: 168, y: 117 },
// 		{ x: 159, y: 152 },
// 		{ x: 132, y: 55 }])
// 	const pioneer = Unit.create('pioneer', startCoordinates, Owner.player())
// 	const soldier = Unit.create('soldier', startCoordinates, Owner.player())
// 	const caravel = Unit.create('caravel', startCoordinates, Owner.player())
// 	Unit.loadUnit(caravel, pioneer)
// 	Unit.loadUnit(caravel, soldier)
// 	MapView.centerAt(startCoordinates, 0, {
// 		x: 0.3,
// 		y: 0.5
// 	})
// 	UnitMapView
// 	Record.setGlobal('defaultShipArrival', startCoordinates)

// 	return caravel
// }

const americaLarge = () => {
  const startCoordinates = Util.choose(
    MapEntity.get().tiles.filter(Tile.isPossibleStartLocation)
  ).mapCoordinates

  const pioneer = Unit.create('scout', startCoordinates, Owner.player())
  const soldier = Unit.create('settler', startCoordinates, Owner.player())
  const caravel = Unit.create('caravel', startCoordinates, Owner.player())
  Unit.loadUnit(caravel, pioneer)
  Unit.loadUnit(caravel, soldier)
  MapView.centerAt(startCoordinates, 0, {
    x: 0.5,
    y: 0.5,
  })
  MapView.zoomBy(1 / 0.35, null, 0)
  Record.setGlobal('defaultShipArrival', startCoordinates)

  return caravel
}

const nextFrame = () => new Promise(resolve => requestAnimationFrame(resolve))

let loadingResources = null
const preload = (clickResume) => {
  Message.initialize.log(`Downloading files (2/${Resources.numberOfAssets()})...`)
  loadingResources = Resources.initialize()

  Savegame.initialize(clickResume)
}

const start = async () => {
  try {
    if (!loadingResources) {
      preload()
    }

    Savegame.start()

    await nextFrame()

    Owner.initialize()

    // MapEntity.create({ data: americaSmallMap })
    MapEntity.create({ data: americaLargeMap })

    await nextFrame()

    AssmebleMap.initialize()

    await nextFrame()

    await loadingResources

    RenderView.initialize()

    await nextFrame()
    MapView.initialize()
    await nextFrame()
    Tween.initialize()
    await nextFrame()
    PathFinder.initialize()
    await nextFrame()

    Europe.initialize()
    Treasure.initialize()
    Market.initialize()
    await nextFrame()
    Tribe.createFromMap(MapEntity.get())
    await nextFrame()

    AutosaveView.initialize()
    Overlay.initialize()
    Dialog.initialize()

    // start game!
    // const caravel = americaSmall()
    const caravel = americaLarge()

    await nextFrame()
    MapView.zoomBy(1 / 0.35, null, 0)
    MapView.zoomBy(1 / 0.35, null, 100)
    setTimeout(async () => {
      Message.initialize.log('Starting game...')
      MapView.zoomBy(0.35, null, 3000)
    }, 100)

    setTimeout(() => {
      Background.get().layer.show()
      Foreground.get().layer.show()
    }, 750)

    setTimeout(() => {
      Input.initialize()
      Dialog.open('welcome', {
        caravel,
        select: () => UnitMapView.select(caravel)
      })
    }, 3500)

    FullscreenEvents.initialize()

    await nextFrame()
    initialize()
  } catch (err) {
    Error.capture(err)
    Dialog.open('error.initialize')
  }
}

const load = async () => {
  try {
    if (!loadingResources) {
      preload()
    }

    await loadingResources

    await nextFrame()
    RenderView.initialize()

    await nextFrame()
    Tween.initialize()

    MapView.initialize()
    await nextFrame()

    // for no apparent reason the layers are not available inside TreasureView
    Europe.initialize()
    Treasure.initialize()
    await nextFrame()
    Message.initialize.log('Restoring game state...')
    await nextFrame()
    Record.resume(Savegame.derived.gameData.value, () => AssmebleMap.initialize())
    await nextFrame()
    AutosaveView.initialize()
    Dialog.initialize()

    MapView.zoomBy(0.7, null, 100)
    Message.initialize.log('Starting game...')

    setTimeout(() => {
      Background.get().layer.show()
      Foreground.get().layer.show()
      Overlay.initialize()
    }, 750)

    setTimeout(() => {
      Input.initialize()
    }, 750)

    FullscreenEvents.initialize()

    if (RESUME_GAME_PAUSED) {
      Time.togglePause()
    }
    initialize()
  } catch (err) {
    Error.capture(err)
    if (Record.getGlobal('revision') !== Version.revision) {
      Dialog.open('error.load')
    } else {
      Dialog.open('error.initialize')
    }
  }
}

const save = Savegame.save

export default {
  start,
  load,
  save,
  preload,
}
