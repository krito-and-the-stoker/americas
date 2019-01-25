import TWEEN from '@tweenjs/tween.js'

import RenderView from 'render/view'
import Foreground from 'render/foreground'
import Background from 'render/background'
import Click from 'input/click'
import Drag from 'input/drag'
import Wheel from 'input/wheel'
import MoveTo from 'command/moveTo'
import Commander from 'command/commander'
import Secondary from 'input/secondary'
import Message from 'view/ui/message'
import Notification from 'view/ui/notification'
import Events from 'view/ui/events'
import MapEntity from 'entity/map'
import Tile from 'entity/tile'

import UnitView from './unit'
import ColonyView from './colony'
import SettlementView from './settlement'
import InfoView from './info'

const MIN_SCALE = 0.4
const MAX_SCALE = 4
const TILE_SIZE = 64

let stopRollingOut = () => {}
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

const centerAt = ({ x, y }, moveTime, screen = { x: 0.5, y: 0.5 }) => {
	const scale = RenderView.get().scale
	const target = {
		x: -scale*TILE_SIZE*x + screen.x * RenderView.getDimensions().x,
		y: -scale*TILE_SIZE*y + screen.y * RenderView.getDimensions().y
	}
	moveMap(target, moveTime)
}


let forestVisibility = true
const hideForest = () => {
	forestVisibility = false
	MapEntity.get().tiles
		.filter(tile => tile.forest)
		.forEach(tile => Tile.update.tile(tile))
	Background.render()
}
const showForest = () => {
	forestVisibility = true
	MapEntity.get().tiles
		.filter(tile => tile.forest)
		.forEach(tile => Tile.update.tile(tile))
	Background.render()
}
const toggleForestVisibility = () => {
	forestVisibility = !forestVisibility
	MapEntity.get().tiles
		.filter(tile => tile.forest)
		.forEach(tile => Tile.update.tile(tile))
	Background.render()
}
const isForestVisible = () => forestVisibility



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

const initialize = () => {
	ColonyView.initialize()
	UnitView.initialize()
	SettlementView.initialize()
	Notification.initialize()
	InfoView.initialize()

	const stage = Foreground.get().layer.app.stage

	let initialCoords = null
	const start = coords => {
		stopRollingOut = () => { initialCoords = null }
		if (!Foreground.hasOpenScreen()) {		
			initialCoords = {
				x: RenderView.get().coords.x - coords.x,
				y: RenderView.get().coords.y - coords.y
			}
		}
	}
	const move = coords => {
		if (initialCoords) {		
			const from = RenderView.get().coords
			const target = {
				x: initialCoords.x + coords.x,
				y: initialCoords.y + coords.y
			}
			if (moveTween !== null) {
				moveMap(target, 0)
			} else {
				initialCoords = null
			}
		}
	}
	const end = coords => {
		stopRollingOut = () => {}
		initialCoords = null
	}

	Drag.on(stage, start, move, end, true)
	Secondary.on(stage, ({ coords, shiftKey }) => {
		if (!Foreground.hasOpenScreen()) {
			const selectedUnit = UnitView.selectedUnit()
			if (selectedUnit) {
				const target = {
					x: Math.floor((coords.x - RenderView.get().coords.x) / (TILE_SIZE * RenderView.get().scale)),
					y: Math.floor((coords.y - RenderView.get().coords.y) / (TILE_SIZE * RenderView.get().scale))
				}

				if (shiftKey) {
					Commander.scheduleBehind(selectedUnit.commander, MoveTo.create(selectedUnit, target))
				} else {
					Commander.scheduleInstead(selectedUnit.commander, MoveTo.create(selectedUnit, target))
				}
				Events.trigger('move', selectedUnit)
			}
		}
	})

	const ZOOM_FACTOR = 0.001
	const handleWheel = (e) => {
		if (!Foreground.hasOpenScreen()) {		
			stopRollingOut()
			zoomBy(Math.exp(-ZOOM_FACTOR * e.deltaY), { x: Math.round(e.clientX), y: Math.round(e.clientY) })
		}
	}
	Wheel.on(handleWheel)
}

export default {
	zoom,
	zoomBy,
	sanitizeScale,
	moveMap,
	centerAt,
	initialize,
	hideForest,
	showForest,
	isForestVisible,
	toggleForestVisibility
}