import Record from 'util/record'
import Message from 'util/message'

import Time from 'timeline/time'

import MapEntity from 'entity/map'
import Treasure from 'entity/treasure'
import Unit from 'entity/unit'
import Owner from 'entity/owner'

import Commander from 'command/commander'
import Found from 'command/found'
import TradeRoute from 'command/tradeRoute'
import CutForest from 'command/cutForest'
import Plow from 'command/plow'
import Road from 'command/road'

import Foreground from 'render/foreground'

import MapView from 'view/map'
import UnitView from 'view/map/unit'
import UnitScreen from 'view/screen/units'

import Europe from 'view/europe'
import Help from 'view/help'


let controlAllPlayers = false
const handleKeydown = e => {
	if (e.ctrlKey) {	
		if (e.key === 'o') {
			Record.dump()
			e.preventDefault()
		}

		if (e.key === 'g') {
			Treasure.gain(100)
			e.preventDefault()
		}

		if (e.key === 'w') {
			const unit = UnitView.selectedUnit()
			if (unit) {
				const treasure = Unit.create('treasure', unit.mapCoordinates)
				treasure.treasure = Math.round(250 * Math.random())
			}
		}

		if (e.key === 's') {
			Record.download()
			e.preventDefault()
		}

		if (e.key === 'l') {
			Record.upload()
			e.preventDefault()
		}

		if (e.key === 'd') {
			MapEntity.discoverAll()
			e.preventDefault()
		}

		if (e.key === 'a') {
			if (!controlAllPlayers) {
				Message.log('now controlling everyone')
				Record.getAll('owner').forEach(owner => {
					Owner.update.visible(owner, true)
					Owner.update.input(owner, true)
				})
			}
			if (controlAllPlayers) {
				Message.log('now controlling only player')
				Record.getAll('owner').forEach(owner => {
					Owner.update.visible(owner, owner === Owner.player())
					Owner.update.input(owner, owner === Owner.player())
				})
			}
			controlAllPlayers = !controlAllPlayers
			e.preventDefault()
		}
	}

	if (e.key === 'u') {
		if (UnitScreen.isOpen()) {
			UnitScreen.close()
		} else {
			UnitScreen.open()
		}
	}

	if (e.key === ' ') {
		Time.togglePause()
	}

	if (e.key === 'e') {
		Europe.open()
	}

	if (e.key === 'a' || e.key === 'Escape') {
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
	if (unit && !e.ctrlKey && !e.metaKey) {
		if (e.key === 'b') {
			Commander.scheduleInstead(unit.commander, Found.create({ unit }))
		}
		if (e.key === 'p') {
			Commander.scheduleInstead(unit.commander, Plow.create({ unit }))
			Commander.scheduleBehind(unit.commander, CutForest.create({ unit }))
		}

		if (e.key === 'r') {
			Commander.scheduleInstead(unit.commander, Road.create({ unit }))
		}

		if (e.key === 't') {
			Commander.scheduleInstead(unit.commander, TradeRoute.create({ unit }))
		}

		if (e.key === 'c') {
			MapView.centerAt(unit.mapCoordinates, 350)
		}

		if (e.key === 'x') {
			Unit.disband(unit)
		}

		if (e.key === 'B') {
			Commander.scheduleBehind(unit.commander, Found.create({ unit }))
		}
		if (e.key === 'P') {
			Commander.scheduleBehind(unit.commander, Plow.create({ unit }))
			Commander.scheduleBehind(unit.commander, CutForest.create({ unit }))
		}

		if (e.key === 'R') {
			Commander.scheduleBehind(unit.commander, Road.create({ unit }))
		}
	}
}

const initialize = () => {
	window.addEventListener('keydown', handleKeydown)
}

export default { initialize }