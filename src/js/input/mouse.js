import TWEEN from '@tweenjs/tween.js'

import RenderView from '../render/view'
import UnitView from '../view/unit'
import Background from '../render/background'
import Foreground from '../render/foreground'
import MapControl from '../control/map'
import Time from '../timeline/time'
import MoveTo from '../command/moveTo'
import Commander from '../command/commander'

const MOVEMAP_TIME = 350
const CLICK_LONG_TIME = 300
const TILE_SIZE = 64

let mouseDownTime = null
const handleDown = e => mouseDownTime = e.timeStamp
const handleClick = async e => {
	const relativeTIme = e.timeStamp - mouseDownTime
	if (relativeTIme < CLICK_LONG_TIME) {	
		const newCoords = {
			x: RenderView.get().coords.x - e.clientX + Background.get().layer.width / 2,
			y: RenderView.get().coords.y - e.clientY + Background.get().layer.height / 2
		}
		MapControl.moveMap(newCoords, MOVEMAP_TIME)
	} else {
		const activeUnit = UnitView.get().activeUnit
		if (activeUnit) {
			const target = {
				x: Math.floor((e.clientX - RenderView.get().coords.x) / (TILE_SIZE * RenderView.get().scale)),
				y: Math.floor((e.clientY - RenderView.get().coords.y) / (TILE_SIZE * RenderView.get().scale))
			}
			Commander.scheduleInstead(activeUnit.commander, MoveTo.create(activeUnit, target))
		}
	}
}

const ZOOM_FACTOR = 0.001
const handleScroll = (e) => {
	MapControl.zoomBy(Math.exp(-ZOOM_FACTOR * e.deltaY))
}

const initialize = () => {
	window.addEventListener('click', handleClick)
	window.addEventListener('mousedown', handleDown)
	window.addEventListener('wheel', handleScroll)
}


export default {
	initialize
}