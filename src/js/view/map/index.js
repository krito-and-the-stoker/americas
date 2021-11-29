import TWEEN from '@tweenjs/tween.js'

import Tween from 'util/tween'
import Binding from 'util/binding'

import MapEntity from 'entity/map'
import Tile from 'entity/tile'

import MoveTo from 'command/moveTo'
import Commander from 'command/commander'
import Europe from 'command/europe'
import TriggerEvent from 'command/triggerEvent'

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
import Events from 'util/events'
import Notification from 'view/ui/notification'
import Dialog from 'view/ui/dialog'

import UnitPanel from 'view/panel/unit'

// min scale means how far can you zoom out
const MIN_SCALE = 0.3
const MAX_SCALE = 4
const TILE_SIZE = 64

let moveTween = null
const moveMap = (newCoords, moveTime = 0) => {
	if (zoomTween) {
		return
	}
	if (moveTween) {
		moveTween.stop()
		moveTween = null
	}
	if (moveTime > 0) {	
		moveTween = new TWEEN.Tween(RenderView.get().coords)
			.to(newCoords, moveTime)
			.easing(TWEEN.Easing.Quadratic.Out)
			.onUpdate(RenderView.updateMapCoords)
			.onComplete(() => { moveTween = null })
			.start()
	} else {
		RenderView.updateMapCoords(newCoords)
	}
}

const centerAt = ({ x, y }, moveTime, screen = { x: 0.5, y: 0.5 }) => {
	if (zoomTween) {
		zoomTween.onComplete(() => centerAt({ x, y }, moveTime, screen))
		return
	}

	const scale = RenderView.get().scale
	const target = {
		x: -scale*TILE_SIZE*x + screen.x * RenderView.getDimensions().x,
		y: -scale*TILE_SIZE*y + screen.y * RenderView.getDimensions().y
	}
	moveMap(target, moveTime)
}

// not used currently, but probably useful in the future
const tileAt = ({ x, y }) => {
	const scale = RenderView.get().scale
	const tileCoords = {
		x: Math.floor(- (RenderView.get().coords.x - x) / (TILE_SIZE * scale)),
		y: Math.floor(- (RenderView.get().coords.y - y) / (TILE_SIZE * scale)),
	}
	
	return MapEntity.tile(tileCoords)	
}

const state = {
	forestVisibility: true,
	supportOverlayColoring: false
}

const listen = {
	forestVisibility: fn => Binding.listen(state, 'forestVisibility', fn),
	supportOverlayColoring: fn => Binding.listen(state, 'supportOverlayColoring', fn)
}

const update = {
	forestVisibility: value => Binding.update(state, 'forestVisibility', value),
	supportOverlayColoring: value => Binding.update(state, 'supportOverlayColoring', value)
}


const hideForest = () => {
	update.forestVisibility(false)
	MapEntity.get().tiles
		.filter(tile => tile.forest)
		.forEach(tile => Tile.update.tile(tile))
	Background.render()
}
const showForest = () => {
	update.forestVisibility(true)
	MapEntity.get().tiles
		.filter(tile => tile.forest)
		.forEach(tile => Tile.update.tile(tile))
	Background.render()
}
const toggleForestVisibility = () => {
	update.forestVisibility(!state.forestVisibility)
	MapEntity.get().tiles
		.filter(tile => tile.forest)
		.forEach(tile => Tile.update.tile(tile))
	Background.render()
}
const isForestVisible = () => state.forestVisibility

const showSupportOverlay = () => {
	update.supportOverlayColoring(true)
	Background.render()
}
const hideSupportOverlay = () => {
	update.supportOverlayColoring(false)
	Background.render()
}

const toggleSupportOverlay = () => {
	if (state.supportOverlayColoring) {
		hideSupportOverlay()
	} else {
		showSupportOverlay()
	}
}

// TODO: Repaint map when food storage changes
const tileTint = (tile) => {
	if (state.supportOverlayColoring) {
		if (tile.colony && tile.colony.storage.food > 1) {
			return 0x00FF00
		}
		if (tile.domain === 'sea') {
			return 0xFFFFFF
		}
		if (Tile.supportingColony(tile)) {
			const colony = Tile.supportingColony(tile)
			if (colony.storage.food > 1) {
				return 0xCCFF77
			}
		}

		return 0xFFAAAA
	}

	return 0xFFFFFF
}


const sanitizeScale = scale => (scale < MIN_SCALE ? MIN_SCALE : (scale > MAX_SCALE ? MAX_SCALE : scale))

let zoomTween = null
const zoom = (targetScale, center = null, scaleTime = 0) => {
	if (zoomTween) {
		zoomTween.stop()
		zoomTween = null
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
			.onComplete(() => { zoomTween = null })
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
		Events.trigger('drag')
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
			if (!moveTween) {
				moveMap(target)
			} else {
				initialCoords = null
			}
		}
	}
	const end = () => {
		initialCoords = null
	}

	Drag.on(stage, start, move, end, { highlight: false })
	Secondary.on(stage, ({ coords, shiftKey }) => {
		if (!Foreground.hasOpenScreen()) {
			const selectedUnit = UnitView.selectedUnit()
			if (selectedUnit) {
				const target = {
					x: Math.floor((coords.x - RenderView.get().coords.x) / (TILE_SIZE * RenderView.get().scale)),
					y: Math.floor((coords.y - RenderView.get().coords.y) / (TILE_SIZE * RenderView.get().scale))
				}

				if (shiftKey) {
					Commander.scheduleBehind(selectedUnit.commander, MoveTo.create({ unit: selectedUnit, coords: target }))
				} else {
					Commander.scheduleInstead(selectedUnit.commander, MoveTo.create({ unit: selectedUnit, coords: target }))
				}
				const targetTile = MapEntity.tile(target)
				if (targetTile.name === 'sea lane') {	
					Dialog.create({
						type: 'naval',
						text: 'Would you like to set sail for Europe?',
						options: [{
							text: 'Yes, steady as she goes!',
							action: () => {
								Commander.scheduleBehind(selectedUnit.commander, Europe.create({ unit: selectedUnit }))
								Commander.scheduleBehind(selectedUnit.commander, TriggerEvent.create({ name: 'notification', type: 'europe', unit: selectedUnit }))
							}								
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
	const handleWheel = ({ delta, position }) => {
		if (!Foreground.hasOpenScreen()) {		
			Events.trigger('zoom')
			zoomBy(Math.exp(-ZOOM_FACTOR * delta.y), { x: Math.round(position.x), y: Math.round(position.y) })
		}
	}
	Wheel.on(handleWheel)

	Events.listen('combat', ({ coords }) => {
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
	listen,
	zoomBy,
	sanitizeScale,
	moveMap,
	tileTint,
	centerAt,
	initialize,
	hideForest,
	showForest,
	isForestVisible,
	toggleForestVisibility,
	toggleSupportOverlay
}