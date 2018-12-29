import RenderView from '../render/view'
import Background from '../render/background'
import MapControl from '../control/map'

let currentStartCoords = null
let currentSpeed = null
let lastCoords = null
const touchStart = (e) => {
	currentStartCoords = {
		x: -RenderView.get().coords.x + e.touches[e.which].clientX,
		y: -RenderView.get().coords.y + e.touches[e.which].clientY
	}
	lastCoords = {
		x: RenderView.get().coords.x,
		y: RenderView.get().coords.y
  }
	currentSpeed = {
		x: 0,
		y: 0
	}

	const handleSpeedDeterioration = () => {
		if (!moveHandled) {
			currentSpeed = {
				x: 0.7*currentSpeed.x,
				y: 0.7*currentSpeed.y
			}
		}
		if (currentStartCoords) {
			requestAnimationFrame(handleSpeedDeterioration)
		}
	}
	requestAnimationFrame(handleSpeedDeterioration)
}

let moveHandled = false
const touchMove = (e) => {
	const newCoords = {
		x: -currentStartCoords.x + e.touches[e.which].clientX,
		y: -currentStartCoords.y + e.touches[e.which].clientY
	}
	currentSpeed = {
		x: 0.3*currentSpeed.x + 0.9*(newCoords.x - lastCoords.x),
		y: 0.3*currentSpeed.y + 0.9*(newCoords.y - lastCoords.y)
	}
	lastCoords = { ...newCoords }
	MapControl.moveMap(newCoords)
	moveHandled = true
	requestAnimationFrame(() => moveHandled = false)
}
const touchEnd = (e) => {
	currentStartCoords = null
	const rollOut = () => {
		if(!currentStartCoords && currentSpeed.x*currentSpeed.x + currentSpeed.y*currentSpeed.y > 2) {
			const newCoords = {
				x: currentSpeed.x + lastCoords.x,
				y: currentSpeed.y + lastCoords.y
			}
			currentSpeed.x *= .9
			currentSpeed.y *= .9
			lastCoords = { ...newCoords }

			moveMap(newCoords)

			requestAnimationFrame(rollOut)
		}
	}

	rollOut()
}

const initialize = () => {
	window.addEventListener('touchstart', touchStart)
	window.addEventListener('touchmove', touchMove)
	window.addEventListener('touchend', touchEnd)
}

export default {
	initialize
}