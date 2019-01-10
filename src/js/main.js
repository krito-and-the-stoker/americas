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
import Europe from './view/europe'
import Time from './timeline/time'
import PathFinder from './util/pathFinder'
import MapView from './view/map'
import Dialog from './view/ui/dialog'
import TreasureView from './view/treasure'
import Foreground from './render/foreground'
import Record from './util/record'

const update = (deltaTime) => {
	Time.advance(deltaTime)
}

const draw = () => {
	RenderView.onDraw()
}

const americaSmall = () => {
	const x = 125
	const y = 65
	const pioneer = Unit.create('pioneer', { x, y }, { active: false })
	const soldier = Unit.create('soldier', { x, y }, { active: false })
	const caravel = Unit.create('caravel', { x, y }, {
		cargo: [soldier, pioneer]
	})
	MapView.centerAt({ x, y })
	Record.setGlobal('defaultShipArrival', { x, y })
}

const americaLarge = () => {
	const x = 135
	const y = 135
	const pioneer = Unit.create('pioneer', { x, y }, { active: false })
	const soldier = Unit.create('soldier', { x, y }, { active: false })
	const caravel = Unit.create('caravel', { x, y }, {
		cargo: [soldier, pioneer]
	})
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
		MapView.initializeInteraction()
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
