import MapEntity from './entity/map.js'
import MapView from './view/map.js'
import RenderView from './render/view.js'
import americaMap from './data/america-large.json'

const initialize = async () => {
	const mapEntity = new MapEntity({ data: americaMap })
	const mapView = new MapView({ mapEntity })
	const renderView = await RenderView.initialize(mapView)
}


window.addEventListener('load', () => {
	initialize()
})
