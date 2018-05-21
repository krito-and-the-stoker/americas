import Background from './render/background.js'
import Foreground from './render/foreground.js'
import MapEntity from './entity/map.js'
import MapView from './view/map.js'
import americaMap from './data/america-large.json'

const initialize = async () => {
	const mapEntity = new MapEntity({ data: americaMap })
	const mapView = new MapView({ mapEntity })

	const background = await Background.initialize(mapView)
	const foreground = await Foreground.initialize()
}


window.addEventListener('load', () => {
	initialize()
})
