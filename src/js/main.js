import MainLoop from 'mainloop.js'

import MapEntity from './entity/map.js'
import RenderMap from './render/map.js'
import RenderView from './render/view.js'
import Keyboard from './input/keyboard.js'
import americaSmallMap from './data/america-small.json'
import americaLargeMap from './data/america-large.json'
import Tween from './util/tween.js'
import Unit from './entity/unit'
import Ressources from './render/ressources'
import Europe from './entity/europe'
import Time from './timeline/time'
import PathFinder from './util/pathFinder'
import MapView from './view/map'
import Dialog from './view/ui/dialog'
import TreasureView from './view/treasure'
import Foreground from './render/foreground'
import Record from './util/record'
import Util from './util/util'

const update = (deltaTime) => {
	Time.advance(deltaTime)
}

const draw = () => {
	RenderView.onDraw()
}

const americaSmall = () => {
	const startCoordinates = Util.choose([{ x: 125, y: 65 },
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
	const x = 135
	const y = 135
	const pioneer = Unit.create('pioneer', { x, y })
	const soldier = Unit.create('soldier', { x, y })
	const caravel = Unit.create('caravel', { x, y })
	Unit.loadUnit(caravel, pioneer)
	Unit.loadUnit(caravel, soldier)
	MapView.centerAt({ x, y })
	MapView.zoomBy(1/0.35, null, 0)
	Record.setGlobal('defaultShipArrival', { x, y })
}

const initialize = () => {
	MapEntity.create({ data: americaSmallMap })
	const mapRendering = new RenderMap()
	
	RenderView.initialize(mapRendering)
	Dialog.initialize()
	Tween.initialize()
	MapView.initialize()
	Europe.initialize()

	PathFinder.initialize()

	americaSmall()

	// for no apparent reason the layers are not available inside TreasureView
	TreasureView.initialize(Foreground.get().permanent)

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
}


window.addEventListener('load', async () => {
	await Ressources.initialize()
	initialize()
})
