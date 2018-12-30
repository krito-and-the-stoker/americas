import MainLoop from 'mainloop.js'

import MapEntity from './entity/map.js'
import MapView from './view/map.js'
import RenderView from './render/view.js'
import Mouse from './input/mouse.js'
import Touch from './input/touch.js'
import Keyboard from './input/keyboard.js'
import americaMap from './data/america-small.json'
import Tween from './util/tween.js'
import Unit from './entity/unit'
import UnitView from './view/unit'
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

const initialize = async () => {
	const mapEntity = new MapEntity({ data: americaMap })
	const mapView = new MapView({ mapEntity })
	
	await RenderView.initialize(mapView)
	await UnitView.initialize()
	Tween.initialize()

	PathFinder.initialize(mapEntity)

	const caravel = Unit.create('caravel', 125, 65)
	const caravel2 = Unit.create('caravel', 125, 66)
	MapControl.moveMap({ x: -64*125 + RenderView.getDimensions().x / 2, y: -64*65 + RenderView.getDimensions().y / 2})
	MapControl.zoomBy(1/0.35, 0)
	setTimeout(() => {
		MapControl.zoomBy(0.35, 2500)
	}, 50)

	setTimeout(() => {
		Mouse.initialize()
		Keyboard.initialize()
		Touch.initialize()		
	}, 2550)

	Time.schedule(Report.create())

	await Dialog.initialize()

	MainLoop.setUpdate(update)
	MainLoop.setDraw(draw)
	MainLoop.start()

	Dialog.create('Hallo', ['Ok'])
}


window.addEventListener('load', () => {
	initialize()
})
