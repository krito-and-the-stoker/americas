import Background from './background.js'
import Foreground from './foreground.js'

let scale = 1
let coords = {
	x: 0,
	y: 0,
}

const get = () => ({
	scale,
	coords
})

const getDimensions = () => ({
	x: Background.get().layer.width,
	y: Background.get().layer.height
})

const updateMapCoords = ({ x, y }) => {
	coords = { x: Math.round(x), y: Math.round(y) }
	Foreground.updateCoords(coords)
	Background.updateCoords(coords)
}

const updateScale = newScale => {
	scale = newScale
	Foreground.updateScale(scale)
	Background.updateScale(scale)
}

const initialize = async mapView => {
	await Background.initialize(mapView)
	await Foreground.initialize()
}

export default {
	updateMapCoords,
	updateScale,
	getDimensions,
	initialize,
	get
}
