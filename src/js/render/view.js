import Background from './background.js'
import Foreground from './foreground.js'
import Record from '../util/record'

Record.setGlobal('scale', 1)
Record.setGlobal('coords', {
	x: 0,
	y: 0,
})

const get = () => ({
	scale: Record.getGlobal('scale'),
	coords: Record.getGlobal('coords')
})

let resizeFunctions = []

const restart = () => {
	const { scale, coords } = get()
	updateScale(scale)
	updateMapCoords(coords)
	Background.restart()
}

const getDimensions = () => ({
	x: Background.get().layer.width,
	y: Background.get().layer.height
})

const getCenter = () => ({
	x: Background.get().layer.width / 2,
	y: Background.get().layer.height / 2	
})

const updateMapCoords = ({ x, y }) => {
	const coords = { x: Math.round(x), y: Math.round(y) }
	Record.setGlobal('coords', coords)
	Foreground.updateCoords(coords)
	Background.updateCoords(coords)
}

const updateScale = newScale => {
	Record.setGlobal('scale', newScale)
	Foreground.updateScale(newScale)
	Background.updateScale(newScale)
}

const initialize = mapView => {
	Background.initialize(mapView)
	Foreground.initialize()
	window.addEventListener('resize', () => resizeFunctions
		.forEach(fn => fn({
			dimensions: getDimensions(),
			scale: Record.getGlobal('scale'),
			coords: Record.getGlobal('coords')
		})))
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
		scale: Record.getGlobal('scale'),
		coords: Record.getGlobal('coords')
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
	restart,
	onDraw,
	render,
	get
}
