import RenderView from '../render/view'
import Background from '../render/background'
import TWEEN from '@tweenjs/tween.js'

let tween = null
const moveMap = newCoords => {
	if (tween) {
		tween.stop()
	}
	tween = new TWEEN.Tween(RenderView.get().coords)
		.to(newCoords, 350)
		.easing(TWEEN.Easing.Quadratic.Out)
		.onUpdate(RenderView.updateMapCoords)
		.start()
}


const handleClick = (e) => {
	const newCoords = {
		x: RenderView.get().coords.x - e.clientX + Background.get().layer.width / 2,
		y: RenderView.get().coords.y - e.clientY + Background.get().layer.height / 2
	}
	moveMap(newCoords)
}

const initialize = () => {
	window.addEventListener('click', handleClick)
}

export default {
	initialize
}