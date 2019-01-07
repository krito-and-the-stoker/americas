import MainLoop from 'mainloop.js'

import MapEntity from './entity/map.js'
import MapView from './view/map.js'
import RenderView from './render/view.js'
import Keyboard from './input/keyboard.js'
import americaSmallMap from './data/america-small.json'
import americaLargeMap from './data/america-large.json'
import Tween from './util/tween.js'
import Unit from './entity/unit'
import Ressources from './render/ressources'
import Europe from './view/europe'
import Time from './timeline/time'
import Report from './command/report'
import PathFinder from './util/pathFinder'
import MapControl from './control/map'
import Dialog from './view/dialog'

const update = (deltaTime) => {
	Time.advance(deltaTime)
}

const draw = () => {
	RenderView.onDraw()
}

const americaSmall = () => {
	const pioneer = Unit.create('pioneer', 125, 65, { active: false })
	const soldier = Unit.create('soldier',125, 65, { active: false })
	const caravel = Unit.create('caravel', 125, 65, {
		cargo: [soldier, pioneer]
	})
	MapControl.centerAt({ x: 125, y: 65 })
	Unit.create('caravel', 125, 65)
	Unit.create('caravel', 125, 65)
	Unit.create('caravel', 125, 65)
}

const americaLarge = () => {
	const x = 135
	const y = 135
	const pioneer = Unit.create('pioneer', x, y, { active: false })
	const soldier = Unit.create('soldier',x, y, { active: false })
	const caravel = Unit.create('caravel', x, y, {
		cargo: [soldier, pioneer]
	})
	MapControl.centerAt({ x, y })
	MapControl.zoomBy(1/0.35, null, 0)
}

const initialize = async () => {
	MapEntity.create({ data: americaSmallMap })
	const mapView = new MapView()
	
	await Ressources.initialize()
	await RenderView.initialize(mapView)
	Dialog.initialize()
	Tween.initialize()

	PathFinder.initialize()
	Europe.initialize()

	americaSmall()

	MapControl.zoomBy(1/0.35, null, 0)
	setTimeout(() => {
		MapControl.zoomBy(0.35, null, 2000)
	}, 50)

	setTimeout(() => {
		Keyboard.initialize()
		MapControl.initializeInteraction()
	}, 2050)

	Time.schedule(Report.create())


	MainLoop.setUpdate(update)
	MainLoop.setDraw(draw)
	MainLoop.start()

	// Dialog.create('Hallo', ['Ok'], 'scout')
}


window.addEventListener('load', () => {
	initialize()
})
