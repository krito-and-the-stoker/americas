import MainLoop from 'mainloop.js'

import MapEntity from '../entity/map.js'
import RenderMap from '../render/map.js'
import RenderView from '../render/view.js'
import Keyboard from '../input/keyboard.js'
import americaSmallMap from '../data/america-small.json'
import americaLargeMap from '../data/america-large.json'
import Tween from '../util/tween.js'
import Unit from '../entity/unit'
import Ressources from '../render/ressources'
import Europe from '../entity/europe'
import Time from '../timeline/time'
import PathFinder from '../util/pathFinder'
import MapView from '../view/map'
import Dialog from '../view/ui/dialog'
import TreasureView from '../view/treasure'
import YearView from '../view/year'
import Foreground from '../render/foreground'
import Background from '../render/background'
import Record from '../util/record'
import Util from '../util/util'
import Tribe from '../entity/tribe'

const update = (deltaTime) => {
	Time.advance(deltaTime)
}

const draw = () => {
	RenderView.onDraw()
}

const americaSmall = () => {
	const startCoordinates = Util.choose([
	{ x: 135, y: 82 },
	{ x: 152, y: 105 },
	{ x: 168, y: 117 },
	{ x: 159, y: 152 },
	{ x: 132, y: 55 }])
	const pioneer = Unit.create('pioneer', startCoordinates)
	const soldier = Unit.create('soldier', startCoordinates)
	const caravel = Unit.create('caravel', startCoordinates)
	Unit.loadUnit(caravel, pioneer)
	Unit.loadUnit(caravel, soldier)
	MapView.centerAt(startCoordinates)
	Record.setGlobal('defaultShipArrival', startCoordinates)
}

const americaLarge = () => {
	const startCoordinates = Util.choose([
	{ x: 172, y: 113 },
	{ x: 182, y: 102 },
	{ x: 167, y: 141 },
	{ x: 171, y: 160 },
	{ x: 181, y: 168 },
	{ x: 200, y: 180 },
	{ x: 231, y: 206 },
	{ x: 286, y: 243 },
	{ x: 275, y: 296 },
	{ x: 235, y: 354 }])
	const pioneer = Unit.create('pioneer', startCoordinates)
	const soldier = Unit.create('soldier', startCoordinates)
	const caravel = Unit.create('caravel', startCoordinates)
	Unit.loadUnit(caravel, pioneer)
	Unit.loadUnit(caravel, soldier)
	MapView.centerAt(startCoordinates)
	MapView.zoomBy(1/0.35, null, 0)
	Record.setGlobal('defaultShipArrival', startCoordinates)
}

const initialize = () => {
	MapEntity.create({ data: americaSmallMap })
	// MapEntity.create({ data: americaLargeMap })
	const mapRendering = new RenderMap()
	
	RenderView.initialize(mapRendering)
	MapView.initialize()
	Dialog.initialize()
	Tween.initialize()
	PathFinder.initialize()

	Europe.initialize()
	Tribe.createFromMap(MapEntity.get())

	// for no apparent reason the layers are not available inside TreasureView
	TreasureView.initialize(Foreground.get().permanent)
	YearView.initialize(Foreground.get().permanent)

	// start game!
	americaSmall()
	// americaLarge()

	MapView.zoomBy(1/0.35, null, 0)
	setTimeout(() => {
		MapView.zoomBy(0.35, null, 100)
	}, 50)

	setTimeout(() => {
		Keyboard.initialize()
	}, 150)

	document.addEventListener('visibilitychange', () => {
		if (document.hidden) {
			MainLoop.stop()
		} else {
			MainLoop.start()
		}
	})

	MainLoop.setUpdate(update)
	MainLoop.setDraw(draw)
	MainLoop.start()

	Background.get().layer.show()
	Foreground.get().layer.show()		
	// document.documentElement.requestFullscreen()
}


window.addEventListener('load', async () => {
	await Ressources.initialize()
	initialize()
})
