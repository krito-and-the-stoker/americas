import MapEntity from './entity/map.js'
import MapView from './view/map.js'
import RenderView from './render/view.js'
import Mouse from './input/mouse.js'
import Touch from './input/touch.js'
import Keyboard from './input/keyboard.js'
import americaMap from './data/america-small.json'
import Tween from './util/tween.js'


const initialize = async () => {
	const mapEntity = new MapEntity({ data: americaMap })
	const mapView = new MapView({ mapEntity })
	
	await RenderView.initialize(mapView)
	Mouse.initialize()
	Keyboard.initialize()
	Touch.initialize()
	Tween.initialize()
}


window.addEventListener('load', () => {
	initialize()
})
