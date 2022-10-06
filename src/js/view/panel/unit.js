import Util from 'util/util'
import Record from 'util/record'
import Binding from 'util/binding'

import Tile from 'entity/tile'
import Unit from 'entity/unit'
import Storage from 'entity/storage'
import Colony from 'entity/colony'

import Commander from 'command/commander'
import Found from 'command/found'
import Road from 'command/road'
import Plow from 'command/plow'
import CutForest from 'command/cutForest'
import TradeRoute from 'command/tradeRoute'
import GoTo from 'command/goTo'
import TriggerEvent from 'command/triggerEvent'

import Dom from 'render/dom'
import Foreground from 'render/foreground'

import GoodsView from 'view/goods'
import UnitView from 'view/unit'
import UnitMapView from 'view/map/unit'
import Icon from 'view/ui/icon'
import MapView from 'view/map'

import Dialog from 'view/ui/dialog'


const CARGO_SCALE = .6
const PASSENGER_SCALE = 1
const ICON_SCALE = .5

const displayStorage = unit => unit.properties.cargo > 0 ? unit.storage : unit.equipment

const handleGoTo = unit => {
	if (unit.domain === 'sea') {
		const colonies = Record.getAll('colony')
			.filter(Colony.isCoastal)
		Dialog.create({
			type: 'naval',
			text: 'Where shall we go?<options/>',
			options: colonies.map(colony => ({
				text: `**${colony.name}** (${colony.colonists.length})`,
				action: () => {
					Commander.scheduleInstead(unit.commander, GoTo.create({ unit, colony }))
				}
			})).concat([{
				text: '**London**',
				margin: true,
				action: () => {
					Commander.scheduleInstead(unit.commander, GoTo.create({ unit, europe: true }))
					Commander.scheduleBehind(unit.commander, TriggerEvent.create({ name: 'notification', type: 'europe', unit }))
				}
			}])
		})
	} else {
		const colonies = Record.getAll('colony')
			.filter(colony => Colony.area(colony, 'land') === Unit.area(unit))
		Dialog.create({
			type: 'scout',
			text: 'Where shall we go?<options/>',
			options: colonies.map(colony => ({
				text: `**${colony.name}** (${colony.colonists.length})`,
				action: () => {
					Commander.scheduleInstead(unit.commander, GoTo.create({ unit, colony }))
				}
			}))
		})
	}	
}

const initialize = () => {
	const { h, patch } = Dom

	let unitPanel = document.createElement('div')
	document.body.appendChild(unitPanel)

	const renderCommands = unit => {
		const pioneering = ['cutForest', 'plow', 'road'].includes(unit.command.id)
		const trading = unit.command.id === 'tradeRoute'
		const moving = !unit.tile

		const gotoTextVisible = !pioneering
		const foundColonyVisible = unit.properties.canFound && !moving && !Tile.radius(unit.tile).some(tile => tile.colony) && !unit.tile.settlement && !pioneering
		const buildRoadTextVisible = unit.properties.canTerraform && !moving && !unit.tile.road && !unit.tile.settlement && !pioneering
		const plowTextVisible = unit.properties.canTerraform && !moving && !unit.tile.forest && !unit.tile.plowed && !unit.tile.settlement && !pioneering
		const cutForestTextVisible = unit.properties.canTerraform && !moving && unit.tile.forest && !unit.tile.settlement && !pioneering
		const tradeVisible = unit.properties.cargo > 0 && unit.passengers.length === 0 && !pioneering && !trading

		const command = (text, handler) => h('div', { on: { click: handler } }, text)

		const cancelCommandName = {
			cutForest: 'Cancel cutting forest',
			plow: 'Cancel plow',
			tradeRoute: 'Cancel trade route'
		}[unit.command.id]

		const foundColony = command('Found Colony', () => Commander.scheduleInstead(unit.commander, Found.create({ unit })))
		const trade = command('Trade Route', () => Commander.scheduleInstead(unit.commander, TradeRoute.create({ unit })))
		const buildRoad = command('Build Road', () => Commander.scheduleInstead(unit.commander, Road.create({ unit })))
		const cutForest = command('Cut Forest', () => Commander.scheduleInstead(unit.commander, CutForest.create({ unit })))
		const plow = command('Plow', () => Commander.scheduleInstead(unit.commander, Plow.create({ unit })))
		const goTo = command('Go to', () => handleGoTo(unit))
		const cancel = command(cancelCommandName, () => Commander.clearSchedule(unit.commander))

		return [
			foundColonyVisible && foundColony,
			tradeVisible && trade,
			buildRoadTextVisible && buildRoad,
			cutForestTextVisible && cutForest,
			plowTextVisible && plow,
			gotoTextVisible && goTo,
			cancelCommandName && cancel
		].filter(x => x)
	}

	const render = unit => {
		if (unit && !Foreground.hasOpenScreen()) {
			const name = Unit.name(unit)
			const commandName = (unit.command && unit.command.display) || ''
			const speed = Unit.speed(unit).toFixed(2)
			const strength = Unit.strength(unit).toFixed(2)
			const cost = unit.properties.cost ? unit.properties.cost.toFixed(0) : 0


			const commands = renderCommands(unit)

			const goods = Util.flatten(Storage.goods(displayStorage(unit)).filter(pack => pack.amount > 0)
				.map(pack => [
					h('span', `${Math.floor(pack.amount)}`),
					GoodsView.html(pack.good, CARGO_SCALE)
				]))
			const passengers = unit.passengers.map(passenger => UnitView.html(passenger, PASSENGER_SCALE))
			const treasure = (unit.treasure && `${Math.floor(unit.treasure)}`) || ''

			const supplyColony = Tile.supportingColony(Tile.closest(unit.mapCoordinates))
			const supplyColonyText = supplyColony
				? `Supplies from ${supplyColony.name}`
				: 'No supplies'

			const view = h('div.unit-panel.visible', [
				h('div.commands', commands),
				h('div.name', { on: { click: () => MapView.centerAt(unit.mapCoordinates, 350) } }, name),
				h('div.command-name', commandName),
				h('div.props', [
					h('div.speed', [Icon.html('go', ICON_SCALE), h('span', speed)]),
					h('div.strength', [Icon.html('combat', ICON_SCALE), h('span', strength)]),
					cost && h('div.cost', [Icon.html('gold', ICON_SCALE), h('span', cost)])
				].filter(x => x)),
				h('div.cargo', goods),
				h('div.passengers', passengers),
				h('div.treasure', treasure),
				h('div.supply', supplyColonyText),
			])

			unitPanel = patch(unitPanel, view)
		} else {
			unitPanel = patch(unitPanel, h('div.unit-panel'))
		}
	}

	UnitMapView.listen.selectedView(Binding.map(selectedView =>
		selectedView && selectedView.unit, unit => unit && [
		Unit.listen.properties(unit, () => render(unit)),
		Unit.listen.mapCoordinates(unit, Binding.map(() => Unit.strength(unit), () => render(unit))),
		Unit.listen.mapCoordinates(unit, Binding.map(coords => Tile.closest(coords), () => render(unit))),
		Unit.listen.name(unit, () => render(unit)),
		Storage.listen(displayStorage(unit), () => render(unit)),
		Unit.listen.passengers(unit, () => render(unit)),
		Unit.listen.command(unit, () => render(unit)),
		Unit.listen.tile(unit, () => render(unit)),
		Foreground.listen.screen(() => render(unit))
	] || render(null)))
}

export default { initialize }