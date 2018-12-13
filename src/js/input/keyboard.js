import RenderView from '../render/view'
import TWEEN from '@tweenjs/tween.js'


const ZOOM_FACTOR = 1.25
const MIN_SCALE = 0.125
const MAX_SCALE = 4

const sanitizeScale = scale => (scale < MIN_SCALE ? MIN_SCALE : (scale > MAX_SCALE ? MAX_SCALE : scale))

let tween = null
const handleKeydown = (e) => {
	if (e.key === 'x' || e.key === 'y') {	
		let targetScale = RenderView.get().scale
		if (e.key === 'x') {
			targetScale *= ZOOM_FACTOR
		}
		if (e.key === 'y') {
			targetScale /= ZOOM_FACTOR
		}

		targetScale = sanitizeScale(targetScale)
		if (tween) {
			tween.stop()
		}
		const { scale, coords, } = RenderView.get()
		const screen = RenderView.getDimensions()
		tween = new TWEEN.Tween({ scale, x: coords.x, y: coords.y })
			.to({
				scale: targetScale,
				x: (coords.x - 0.5*screen.x) * (targetScale / scale) + 0.5*screen.x,
				y: (coords.y - 0.5*screen.y) * (targetScale / scale) + 0.5*screen.y
			}, 350)
			.easing(TWEEN.Easing.Quadratic.Out)
			.onUpdate(({ scale, x, y }) => {
				RenderView.updateScale(scale)
				RenderView.updateMapCoords({ x, y })
			})
			.start()
	}
}

const initialize = () => {
	window.addEventListener('keydown', handleKeydown)
}

export default { initialize }