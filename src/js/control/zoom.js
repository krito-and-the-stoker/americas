import TWEEN from '@tweenjs/tween.js'
import RenderView from '../render/view'

const MIN_SCALE = 0.125
const MAX_SCALE = 4

const sanitizeScale = scale => (scale < MIN_SCALE ? MIN_SCALE : (scale > MAX_SCALE ? MAX_SCALE : scale))

let tween = null
const zoom = (targetScale, scaleTime = 0) => {
	if (tween) {
		tween.stop()
	}
	const { scale, coords, } = RenderView.get()
	const screen = RenderView.getDimensions()
	const target = {
		scale: targetScale,
		x: (coords.x - 0.5*screen.x) * (targetScale / scale) + 0.5*screen.x,
		y: (coords.y - 0.5*screen.y) * (targetScale / scale) + 0.5*screen.y
	}
	if (scaleTime > 0) {
		tween = new TWEEN.Tween({ scale, x: coords.x, y: coords.y })
			.to(target, scaleTime)
			.easing(TWEEN.Easing.Quadratic.Out)
			.onUpdate(({ scale, x, y }) => {
				RenderView.updateScale(scale)
				RenderView.updateMapCoords({ x, y })
			})
			.start()
	} else {
		RenderView.updateScale(target.scale)
		RenderView.updateMapCoords({ x: target.x, y: target.y })
	}
}

const zoomBy = (relativeScale, scaleTime) => {
	const currentScale = RenderView.get().scale
	const targetScale = sanitizeScale(relativeScale * currentScale)
	if (targetScale != currentScale) {
		zoom(targetScale, scaleTime)
	}
}

export default {
	zoom,
	zoomBy,
	sanitizeScale,
}