import TWEEN from '@tweenjs/tween.js'
import RenderView from '../render/view'
import Foreground from '../render/foreground'
import Click from '../input/click'
import Drag from '../input/drag'
import Wheel from '../input/wheel'
import UnitView from '../view/unit'
import MoveTo from '../command/moveTo'
import Commander from '../command/commander'

const MIN_SCALE = 0.125
const MAX_SCALE = 4
const TILE_SIZE = 64


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

const centerAt = ({ x, y }, moveTime) => moveMap({ x: -TILE_SIZE*x + RenderView.getDimensions().x / 2, y: -TILE_SIZE*y + RenderView.getDimensions().y / 2}, moveTime)


const sanitizeScale = scale => (scale < MIN_SCALE ? MIN_SCALE : (scale > MAX_SCALE ? MAX_SCALE : scale))

let zoomTween = null
const zoom = (targetScale, center = null, scaleTime = 0) => {
	if (zoomTween) {
		zoomTween.stop()
	}
	const relativeZoomCenter = center ? {
		x: center.x / RenderView.getDimensions().x,
		y: center.y / RenderView.getDimensions().y
	} : { x: 0.5, y: 0.5 }
	const { scale, coords, } = RenderView.get()
	const screen = RenderView.getDimensions()
	const target = {
		scale: targetScale,
		x: (coords.x - relativeZoomCenter.x*screen.x) * (targetScale / scale) + relativeZoomCenter.x*screen.x,
		y: (coords.y - relativeZoomCenter.y*screen.y) * (targetScale / scale) + relativeZoomCenter.y*screen.y
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

const zoomBy = (relativeScale, center, scaleTime) => {
	const currentScale = RenderView.get().scale
	const targetScale = sanitizeScale(relativeScale * currentScale)
	if (targetScale != currentScale) {
		zoom(targetScale, center, scaleTime)
	}
}
const moveBy = (relativeCoords, moveTime) => {
	const currentCoords = RenderView.get().coords
	const targetCoords = {
		x: currentCoords.x + relativeCoords.x,
		y: currentCoords.y + relativeCoords.y
	}
	moveMap(targetCoords, moveTime)
}

const initializeInteraction = () => {
	const stage = Foreground.get().layer.app.stage

	let initialCoords = null
	const start = coords => {
		initialCoords = {
			x: RenderView.get().coords.x - coords.x,
			y: RenderView.get().coords.y - coords.y
		}
	}
	const move = coords => {
		const from = RenderView.get().coords
		const target = {
			x: initialCoords.x + coords.x,
			y: initialCoords.y + coords.y
		}
		moveMap(target, 0)
	}
	const end = coords => {}

	Drag.on(stage, start, move, end, true)
	Click.on(stage, coords => {
		const activeUnit = UnitView.get().activeUnit
		if (activeUnit) {
			const target = {
				x: Math.floor((coords.x - RenderView.get().coords.x) / (TILE_SIZE * RenderView.get().scale)),
				y: Math.floor((coords.y - RenderView.get().coords.y) / (TILE_SIZE * RenderView.get().scale))
			}
			Commander.scheduleInstead(activeUnit.commander, MoveTo.create(activeUnit, target))			
		}
	})

	const ZOOM_FACTOR = 0.001
	const handleWheel = (e) => {
		zoomBy(Math.exp(-ZOOM_FACTOR * e.deltaY), { x: e.clientX, y: e.clientY })
	}
	Wheel.on(handleWheel)

	console.log('control initialized')
}

export default {
	zoom,
	zoomBy,
	sanitizeScale,
	moveMap,
	centerAt,
	initializeInteraction
}