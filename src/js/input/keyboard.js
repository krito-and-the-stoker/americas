import RenderView from '../render/view'
import Zoom from '../control/zoom'

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

		targetScale = Zoom.sanitizeScale(targetScale)
		Zoom.zoom(targetScale, ZOOM_TIME)
	}
}

const initialize = () => {
	window.addEventListener('keydown', handleKeydown)
}

export default { initialize }