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
	Mouse.initialize()
	Keyboard.initialize()
	Touch.initialize()
	Tween.initialize()

	PathFinder.initialize(mapEntity)

	MainLoop.setUpdate(update)
	MainLoop.setDraw(draw)
	MainLoop.start()

	const caravel = Unit.create('caravel', 5, 5)
	const caravel2 = Unit.create('caravel', 5, 6)

	Time.schedule(Report.create())
}


window.addEventListener('load', () => {
	initialize()
})
