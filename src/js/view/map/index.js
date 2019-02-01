import TWEEN from '@tweenjs/tween.js'

import Tween from 'util/tween'

import MapEntity from 'entity/map'
import Tile from 'entity/tile'

import MoveTo from 'command/moveTo'
import Commander from 'command/commander'
import Europe from 'command/europe'

import Drag from 'input/drag'
import Wheel from 'input/wheel'
import Secondary from 'input/secondary'

import RenderView from 'render/view'
import Foreground from 'render/foreground'
import Background from 'render/background'

import UnitView from 'view/map/unit'
import ColonyView from 'view/map/colony'
import SettlementView from 'view/map/settlement'

import Icon from 'view/ui/icon'
import Events from 'view/ui/events'
import Notification from 'view/ui/notification'
import Dialog from 'view/ui/dialog'

import UnitPanel from 'view/panel/unit'


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
// const moveBy = (relativeCoords, moveTime) => {
// 	const currentCoords = RenderView.get().coords
// 	const targetCoords = {
// 		x: currentCoords.x + relativeCoords.x,
// 		y: currentCoords.y + relativeCoords.y
// 	}
// 	moveMap(targetCoords, moveTime)
// }

const initialize = () => {
	ColonyView.initialize()
	UnitView.initialize()
	SettlementView.initialize()
	Notification.initialize()
	UnitPanel.initialize()

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
	const end = () => {
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
				const targetTile = MapEntity.tile(target)
				if (targetTile.name === 'sea lane') {	
					Dialog.create({
						type: 'naval',
						text: 'Would you like to set sail for Europe?',
						options: [{
							text: 'Yes, steady as she goes!',
							action: () => Commander.scheduleBehind(selectedUnit.commander, Europe.create(selectedUnit))
						}, {
							text: 'No let as remain here',
							action: () => {},
							default: true
						}],
						coords: selectedUnit.mapCoordinates
					})
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

	Events.listen('combat', coords => {
		const icon = Icon.create('combat')
		icon.x = TILE_SIZE * (coords.x + 0.5)
		icon.y = TILE_SIZE * (coords.y + 0.5)
		icon.anchor.set(0.5)
		Foreground.addUnit(icon)

		Tween.fadeOut(icon, 3000)
		Tween.scaleTo(icon, 1.5, 3000).then(() => {
			Foreground.removeUnit(icon)
		})
	})
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