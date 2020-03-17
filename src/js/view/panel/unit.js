import * as PIXI from 'pixi.js'

import Util from 'util/util'
import Record from 'util/record'
import Binding from 'util/binding'
import { patch, h } from 'util/virtualDom'

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

import Click from 'input/click'

import Foreground from 'render/foreground'
import RenderView from 'render/view'
import Text from 'render/text'

import GoodsView from 'view/goods'
import UnitView from 'view/unit'
import MapView from 'view/map'
import UnitMapView from 'view/map/unit'
import Icon from 'view/ui/icon'

import Dialog from 'view/ui/dialog'


const cargoScale = .6

const createCommandText = text => {
	const result = Text.create(text)
	result.x = 10
	result.visible = false
	result.buttonMode = true

	return result
}


const initialize = () => {
	window.h = h
	window.patch = patch

	let unitPanel = document.createElement('div')
	document.body.appendChild(unitPanel)

	const render = unit => {
		if (unit) {
			const name = Unit.name(unit)
			const speed = Unit.speed(unit).toFixed(2)
			const strength = Unit.strength(unit).toFixed(2)
			const cost = unit.properties.cost ? unit.properties.cost.toFixed(0) : 0

			const view = h('div.unit-panel.visible', [
				h('div', name),
				h('div', [
					h('div', [Icon.html('go', 0.5), h('span', speed)]),
					h('div', [Icon.html('combat', 0.5), h('span', strength)]),
					cost && h('div', [Icon.html('gold', 0.5), h('span', cost)])
				].filter(x => x))
			])

			unitPanel = patch(unitPanel, view)
		} else {
			unitPanel = patch(unitPanel, h('div.unit-panel'))
		}
	}


	UnitMapView.listen.selectedView(Binding.map(selectedView =>
		selectedView && selectedView.unit, unit => [
		Unit.listen.properties(unit, () => render(unit)),
		Unit.listen.mapCoordinates(Binding.map(() => Unit.strength(unit)), () => render(unit)),
		Unit.listen.name(unit, () => render(unit))
	]))
}


const initializeOld = () => {
	const unitName = Text.create()
	unitName.buttonMode = true
	unitName.x = 10
	unitName.visible = true

	const commandName = Text.create('', { fontSize: 24 })
	commandName.x = 10
	commandName.visible = true

	const gotoText = createCommandText('Go to')
	const foundColony = createCommandText('Found colony')
	const buildRoadText = createCommandText('Build road')
	const plowText = createCommandText('Plow')
	const cancelPioneeringText = createCommandText('Cancel pioneering')
	const cutForestText = createCommandText('Cut down forest')
	const trade = createCommandText('Trade route')
	const cancelTrade = createCommandText('Cancel trade route')

	const unitSpeed = Text.create('')
	const unitStrength = Text.create('')
	const unitCost = Text.create('')
	const speedIcon = Icon.create('go')
	const strengthIcon = Icon.create('combat')
	const costIcon = Icon.create('gold')
	speedIcon.scale.set(0.5)
	strengthIcon.scale.set(0.5)
	costIcon.scale.set(0.5)
	speedIcon.x = 10
	unitSpeed.x = 45
	strengthIcon.x = 110
	unitStrength.x = 145
	costIcon.x = 210
	unitCost.x = 245

	const container = new PIXI.Container()
	container.x = 10

	UnitMapView.listen.selectedView(view => {
		if (view) {
			const unit = view.unit

			let oldUnitStrength = null
			const unsubscribeSpeedAndStorage = [
				Storage.listen(unit.equipment, () => {
					unitSpeed.text = `${Math.round(10 * Unit.speed(unit)) / 10}`
					unitStrength.text = `${Math.round(10 * Unit.strength(unit)) / 10}`
				}),

				Unit.listen.mapCoordinates(unit, () => {
					const newStrength = Math.round(10 * Unit.strength(unit)) / 10
					if (oldUnitStrength !== newStrength) {
						unitStrength.text = `${newStrength}`
					}
				}),

				Unit.listen.properties(unit, properties => {
					if (properties.cost && properties.cost > 0) {
						costIcon.visible = true
						unitCost.text = `${properties.cost}`
					} else {
						costIcon.visible = false
						unitCost.text = ''
					}
				}),

				Unit.listen.name(unit, name => {
					unitName.text = `${Unit.name(unit)}`
				})
			]

			
			const unsubscribeCommand = Unit.listen.command(unit, command => {
				commandName.text = command ? command.display : ''
			})
			const unsubscribeClick = [
				Click.on(unitName, () => {
					MapView.centerAt(unit.mapCoordinates, 350)
				}, `Center map on ${Unit.name(unit)}`),
				Click.on(foundColony, () => {
					Commander.scheduleInstead(unit.commander, Found.create({ unit }))
				}),
				Click.on(buildRoadText, () => {
					Commander.scheduleInstead(unit.commander, Road.create({ unit }))
				}),
				Click.on(plowText, () => {
					Commander.scheduleInstead(unit.commander, Plow.create({ unit }))
				}),
				Click.on(cancelPioneeringText, () => {
					Commander.clearSchedule(unit.commander)
				}),
				Click.on(cutForestText, () => {
					Commander.scheduleInstead(unit.commander, CutForest.create({ unit }))
				}),
				Click.on(trade, () => {
					Commander.scheduleInstead(unit.commander, TradeRoute.create({ unit }))
				}),
				Click.on(cancelTrade, () => {
					Commander.clearSchedule(unit.commander)
				}),
				Click.on(gotoText, () => {
					if (unit.domain === 'sea') {
						const colonies = Record.getAll('colony')
							.filter(Colony.isCoastal)
							.sort((a, b) => b.colonists.length - a.colonists.length)
						Dialog.create({
							type: 'naval',
							text: 'Where shall we go?',
							options: colonies.map(colony => ({
								text: `${colony.name} (${colony.colonists.length})`,
								action: () => {
									Commander.scheduleInstead(unit.commander, GoTo.create({ unit, colony }))
								}
							})).concat([{
								text: 'London',
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
							text: 'Where shall we go?',
							options: colonies.map(colony => ({
								text: `${colony.name} (${colony.colonists.length})`,
								action: () => {
									Commander.scheduleInstead(unit.commander, GoTo.create({ unit, colony }))
								}
							}))
						})
					}
				})
			]


			const updateCommands = () => {
				const pioneering = ['cutForest', 'plow', 'road'].includes(unit.command.id)
				const trading = unit.command.id === 'tradeRoute'
				const moving = !unit.tile
				gotoText.visible = !pioneering
				foundColony.visible = unit.properties.canFound && !moving && !Tile.radius(unit.tile).some(tile => tile.colony) && !unit.tile.settlement && !pioneering
				buildRoadText.visible = unit.properties.canTerraform && !moving && !unit.tile.road && !unit.tile.settlement && !pioneering
				plowText.visible = unit.properties.canTerraform && !moving && !unit.tile.forest && !unit.tile.plowed && !unit.tile.settlement && !pioneering
				cancelPioneeringText.visible = pioneering
				cutForestText.visible = unit.properties.canTerraform && !moving && unit.tile.forest && !unit.tile.settlement && !pioneering
				trade.visible = unit.properties.cargo > 0 && unit.passengers.length === 0 && !pioneering && !trading
				cancelTrade.visible = trading
			}

			const unsubscribeCoords = Unit.listen.mapCoordinates(unit, updateCommands)
			const unsubscribeTile = Unit.listen.tile(unit, updateCommands)
			const unsubscribePioneering = Unit.listen.command(unit, updateCommands)
			const unsubscribeName = Unit.listen.name(unit, updateCommands)

			Foreground.get().notifications.addChild(unitName)
			Foreground.get().notifications.addChild(commandName)
			Foreground.get().notifications.addChild(gotoText)
			Foreground.get().notifications.addChild(foundColony)
			Foreground.get().notifications.addChild(buildRoadText)
			Foreground.get().notifications.addChild(plowText)
			Foreground.get().notifications.addChild(cancelPioneeringText)
			Foreground.get().notifications.addChild(cutForestText)
			Foreground.get().notifications.addChild(trade)
			Foreground.get().notifications.addChild(cancelTrade)

			Foreground.get().notifications.addChild(unitSpeed)
			Foreground.get().notifications.addChild(unitStrength)
			Foreground.get().notifications.addChild(unitCost)
			Foreground.get().notifications.addChild(speedIcon)
			Foreground.get().notifications.addChild(strengthIcon)
			Foreground.get().notifications.addChild(costIcon)


			Foreground.get().notifications.addChild(container)
			const unsubscribePassengersAndStorage = Unit.listen.passengers(unit, passengers => {
				let index = 0
				const unsubscribePassengers = passengers.map(passenger => {
					const passengerView = UnitView.create(passenger)
					const sprite = passengerView.sprite
					sprite.x = index * cargoScale * 32 - 8
					sprite.y = 0
					sprite.scale.set(cargoScale)
					container.addChild(sprite)

					index += 1
	
					return () => {
						Util.execute(passengerView.unsubscribe)
						container.removeChild(sprite)
					}
				})

				let unsubscribeTreasure = () => {}
				if (unit.treasure) {
					const treasureText = Text.create(unit.treasure)
					treasureText.x = 10
					Foreground.get().notifications.addChild(treasureText)
					unsubscribeTreasure = [
						RenderView.listen.dimensions(dimensions => {
							treasureText.y = dimensions.y - 60
						}),
						() =>	Foreground.get().notifications.removeChild(treasureText)
					]
				}

				const storage = unit.properties.cargo > 0 ? unit.storage : unit.equipment
				const unsubscribeStorage = Storage.listen(storage, () => {
					const goods = Storage.goods(storage).filter(pack => pack.amount > 0)
					let storageIndex = 0

					return goods.map(pack => {
						const goodsView = GoodsView.create(pack)
						const offset = index * cargoScale * 32 + (index > 0 ? 20 : 0)
						goodsView.sprite.x = offset + storageIndex * cargoScale * 95 + 5 + 0.25 * goodsView.number.width
						goodsView.sprite.y = 0
						goodsView.sprite.scale.set(cargoScale)
						goodsView.number.x = offset + storageIndex * cargoScale * 95
						goodsView.number.y = 10
						goodsView.number.scale.set(cargoScale)

						storageIndex += 1

						container.addChild(goodsView.number)
						container.addChild(goodsView.sprite)

						return () => {
							container.removeChild(goodsView.number)
							container.removeChild(goodsView.sprite)
						}
					})
				})

				return [
					unsubscribeTreasure,
					unsubscribePassengers,
					unsubscribeStorage,
					unsubscribeCoords,
					unsubscribeTile,
					unsubscribePioneering
				]
			})

			return () => {
				Foreground.get().notifications.removeChild(unitName)
				Foreground.get().notifications.removeChild(commandName)
				Foreground.get().notifications.removeChild(gotoText)
				Foreground.get().notifications.removeChild(foundColony)
				Foreground.get().notifications.removeChild(buildRoadText)
				Foreground.get().notifications.removeChild(plowText)
				Foreground.get().notifications.removeChild(cancelPioneeringText)
				Foreground.get().notifications.removeChild(cutForestText)
				Foreground.get().notifications.removeChild(trade)
				Foreground.get().notifications.removeChild(cancelTrade)

				Foreground.get().notifications.removeChild(unitSpeed)
				Foreground.get().notifications.removeChild(unitStrength)
				Foreground.get().notifications.removeChild(unitCost)
				Foreground.get().notifications.removeChild(speedIcon)
				Foreground.get().notifications.removeChild(strengthIcon)
				Foreground.get().notifications.removeChild(costIcon)

				Foreground.get().notifications.removeChild(container)

				Util.execute([
					unsubscribeCommand,
					unsubscribePassengersAndStorage,
					unsubscribeClick,
					unsubscribeSpeedAndStorage
				])
			}
		}
	})

	const lineOffset = 60
	const lineHeight = 36
	RenderView.updateWhenResized(({ dimensions }) => {
		container.y = dimensions.y - lineOffset

		unitSpeed.y = dimensions.y - lineOffset - 2 * lineHeight
		unitStrength.y = dimensions.y - lineOffset - 2 * lineHeight
		unitCost.y = dimensions.y - lineOffset - 2 * lineHeight
		speedIcon.y = dimensions.y - lineOffset - 2 * lineHeight
		strengthIcon.y = dimensions.y - lineOffset - 2 * lineHeight
		costIcon.y = dimensions.y - lineOffset - 2 * lineHeight

		commandName.y = dimensions.y - lineOffset - 1 * lineHeight
		unitName.y = dimensions.y - lineOffset - 3 * lineHeight
		gotoText.y = dimensions.y - lineOffset - 4 * lineHeight - 20
		cancelPioneeringText.y = dimensions.y - lineOffset - 4 * lineHeight - 20
		trade.y = dimensions.y - lineOffset - 5 * lineHeight - 20
		cancelTrade.y = dimensions.y - lineOffset - 5 * lineHeight - 20
		foundColony.y = dimensions.y - lineOffset - 5 * lineHeight - 20
		buildRoadText.y = dimensions.y - lineOffset - 6 * lineHeight - 20
		plowText.y = dimensions.y - lineOffset - 7 * lineHeight - 20
		cutForestText.y = dimensions.y - lineOffset - 7 * lineHeight - 20
	})
}

export default { initialize }