import TWEEN from '@tweenjs/tween.js'
import RenderView from '../render/view'

const MIN_SCALE = 0.125
const MAX_SCALE = 4


let moveTween = null
const moveMap = (newCoords, moveTime = 0) => {
	if (moveTween) {
		moveTween.stop()
	}
	if (moveTime > 0) {	
		moveTween = new TWEEN.Tween(RenderView.get().coords)
			.to(newCoords, moveTime)
			.easing(TWEEN.Easing.Quadratic.Out)
			.onUpdate(RenderView.updateMapCoords)
			.start()
	} else {
		RenderView.updateMapCoords(newCoords)
	}
}

const centerAt = ({ x, y }, moveTime) => moveMap({ x: -64*x + RenderView.getDimensions().x / 2, y: -64*y + RenderView.getDimensions().y / 2}, moveTime)


const sanitizeScale = scale => (scale < MIN_SCALE ? MIN_SCALE : (scale > MAX_SCALE ? MAX_SCALE : scale))

let zoomTween = null
const zoom = (targetScale, scaleTime = 0) => {
	if (zoomTween) {
		zoomTween.stop()
	}
	const { scale, coords, } = RenderView.get()
	const screen = RenderView.getDimensions()
	const target = {
		scale: targetScale,
		x: (coords.x - 0.5*screen.x) * (targetScale / scale) + 0.5*screen.x,
		y: (coords.y - 0.5*screen.y) * (targetScale / scale) + 0.5*screen.y
	}
	moveMap(target, scaleTime)
	if (scaleTime > 0) {
		zoomTween = new TWEEN.Tween({ scale })
			.to(target, scaleTime)
			.easing(TWEEN.Easing.Quadratic.Out)
			.onUpdate(({ scale }) => {
				RenderView.updateScale(scale)
			})
			.start()
	} else {
		RenderView.updateScale(target.scale)
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
	moveMap,
	centerAt,
}