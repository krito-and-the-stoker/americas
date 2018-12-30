import TWEEN from '@tweenjs/tween.js'

import RenderView from '../render/view'
import Background from '../render/background'
import Foreground from '../render/foreground'
import MapControl from '../control/map'

const MOVEMAP_TIME = 350

const handleClick = (e) => {
	const newCoords = {
		x: RenderView.get().coords.x - e.clientX + Background.get().layer.width / 2,
		y: RenderView.get().coords.y - e.clientY + Background.get().layer.height / 2
	}
	MapControl.moveMap(newCoords, MOVEMAP_TIME)
}

const ZOOM_FACTOR = 0.001
const handleScroll = (e) => {
	MapControl.zoomBy(Math.exp(-ZOOM_FACTOR * e.deltaY))
}

const initialize = () => {
	window.addEventListener('click', handleClick)
	window.addEventListener('wheel', handleScroll)
}


export default {
	initialize
}