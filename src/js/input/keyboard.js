import RenderView from '../render/view'
import MapControl from '../control/map'
import Unit from '../view/unit'
import Time from '../timeline/time'
import Move from '../command/move'
import Found from '../command/found'

const ZOOM_FACTOR = 1.25
const ZOOM_TIME = 350


const handleKeydown = (e) => {
	if (e.key === 'x' || e.key === 'y') {	
		let targetScale = RenderView.get().scale
		if (e.key === 'x') {
			targetScale *= ZOOM_FACTOR
		}
		if (e.key === 'y') {
			targetScale /= ZOOM_FACTOR
		}

		targetScale = MapControl.sanitizeScale(targetScale)
		MapControl.zoom(targetScale, ZOOM_TIME)
	}
	if (e.key === ' ') {
		Time.togglePause()
	}

	const activeUnit = Unit.get().activeUnit
	if (activeUnit) {
		if (e.key === 'b') {
			Time.schedule(Found.create(activeUnit))
		}
	}
	// const activeUnit = Unit.get().activeUnit
	// if(activeUnit) {
	// 	let to = {
	// 		x: activeUnit.mapCoordinates.x,
	// 		y: activeUnit.mapCoordinates.y
	// 	}
	// 	if (e.key === 'ArrowRight') {
	// 		to.x += 1
	// 	}
	// 	if (e.key === 'ArrowLeft') {
	// 		to.x -= 1
	// 	}
	// 	if (e.key === 'ArrowDown') {
	// 		to.y += 1
	// 	}
	// 	if (e.key === 'ArrowUp') {
	// 		to.y -= 1
	// 	}
	// 	if (to.x != activeUnit.mapCoordinates.x || to.y != activeUnit.mapCoordinates.y) {
	// 		Time.schedule(Move.create(activeUnit, to))
	// 	}
	// }
}

const initialize = () => {
	window.addEventListener('keydown', handleKeydown)
}

export default { initialize }