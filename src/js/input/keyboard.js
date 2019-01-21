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
import TradeRoute from '../command/tradeRoute'
import CutForest from '../command/cutForest'
import Plow from '../command/plow'
import Road from '../command/road'
import MapEntity from '../entity/map'
import Treasure from '../entity/treasure'
import Unit from '../entity/unit'
import Help from '../view/help'

const ZOOM_FACTOR = 1.25
const ZOOM_TIME = 350


const handleKeydown = (e) => {
	if (e.ctrlKey) {	
		if (e.key === 'o') {
			Record.dump()
		}

		if (e.key === 'g') {
			Treasure.gain(100)
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
	}

	if (e.key === ' ') {
		Time.togglePause()
	}

	if (e.key === 'e') {
		Europe.open()
	}

	if (e.key === 'm' || e.key === 'a' || e.key === 'Escape') {
		Foreground.closeScreen()
	}

	if (e.key === '+') {
		Time.speedUp()
	}

	if (e.key === '-') {
		Time.slowDown()
	}

	if (e.key === '0') {
		Time.normalize()
	}

	if (e.key === 'h') {
		Help.open()
	}

	if (e.key === 'f') {
		MapView.toggleForestVisibility()
	}

	const unit = UnitView.selectedUnit()
	if (unit) {
		if (e.key === 'b') {
			Commander.scheduleInstead(unit.commander, Found.create(unit))
		}
		if (e.key === 'p') {
			Commander.scheduleInstead(unit.commander, Plow.create(unit))
			Commander.scheduleBehind(unit.commander, CutForest.create(unit))
		}

		if (e.key === 'r') {
			Commander.scheduleInstead(unit.commander, Road.create(unit))
		}

		if (e.key === 't') {
			Commander.scheduleInstead(unit.commander, TradeRoute.create(unit))
		}

		if (e.key === 'c') {
			MapView.centerAt(unit.mapCoordinates, 350)
		}

		if (e.key === 'x') {
			Unit.disband(unit)
		}

		if (e.key === 'B') {
			Commander.scheduleBehind(unit.commander, Found.create(unit))
		}
		if (e.key === 'P') {
			Commander.scheduleBehind(unit.commander, Plow.create(unit))
			Commander.scheduleBehind(unit.commander, CutForest.create(unit))
		}

		if (e.key === 'R') {
			Commander.scheduleBehind(unit.commander, Road.create(unit))
		}
	}
}

const initialize = () => {
	window.addEventListener('keydown', handleKeydown)
}

export default { initialize }