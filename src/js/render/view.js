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

let resizeFunctions = []

const getDimensions = () => ({
	x: Background.get().layer.width,
	y: Background.get().layer.height
})

const getCenter = () => ({
	x: Background.get().layer.width / 2,
	y: Background.get().layer.height / 2	
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
	Foreground.initialize()
	window.addEventListener('resize', () => resizeFunctions.forEach(fn => fn({ dimensions: getDimensions(), scale, coords })))
}

const onDraw = () => {
	if (Background.get().renderRequested) {
		Background.doRenderWork()
	}	
	Foreground.doRenderWork()
}

const updateWhenResized = fn => {
	fn({
		dimensions: getDimensions(),
		scale,
		coords
	})
	resizeFunctions.push(fn)
	return () => resizeFunctions = resizeFunctions.filter(func => func !== fn)
}

const render = Background.render

export default {
	updateMapCoords,
	updateScale,
	getDimensions,
	updateWhenResized,
	getCenter,
	initialize,
	onDraw,
	render,
	get
}
