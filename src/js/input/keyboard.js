import RenderView from '../render/view'
import Foreground from '../render/foreground'
import MapView from '../view/map'
import UnitView from '../view/map/unit'
import Time from '../timeline/time'
import Move from '../command/move'
import Found from '../command/found'
import Europe from '../view/europe'
import Record from '../util/record'
import Commander from '../command/commander'
import CutForest from '../command/cutForest'
import Plow from '../command/plow'
import MapEntity from '../entity/map'
import Treasure from '../entity/treasure'

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

		targetScale = MapView.sanitizeScale(targetScale)
		MapView.zoom(targetScale, ZOOM_TIME)
	}
	if (e.key === ' ') {
		Time.togglePause()
	}

	if (e.key === 'o') {
		Record.dump()
	}

	if (e.key === 'e') {
		Europe.open()
	}

	if (e.key === 'g') {
		Treasure.gain(100)
	}

	if (e.key === 'm' || e.key === 'Escape') {
		Foreground.closeScreen()
	}

	if (e.key === 's') {
		Record.save()
	}

	if (e.key === 'l') {
		Record.load()
	}

	if (e.key === 'd') {
		MapEntity.discoverAll()
	}

	const unit = UnitView.selectedUnit()
	if (unit) {
		if (e.key === 'b') {
			Commander.scheduleInstead(unit.commander, Found.create(unit))
		}
		if (e.key === 'p') {
			if (MapEntity.tile(unit.mapCoordinates).forest) {
				Commander.scheduleInstead(unit.commander, CutForest.create(unit))
			} else {
				Commander.scheduleInstead(unit.commander, Plow.create(unit))
			}
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