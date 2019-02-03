import * as PIXI from 'pixi.js'

import Util from 'util/util'
import Record from 'util/record'
import PathFinder from 'util/pathFinder'

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
import MoveTo from 'command/moveTo'
import Europe from 'command/europe'

import Click from 'input/click'

import Foreground from 'render/foreground'
import RenderView from 'render/view'
import Text from 'render/text'

import GoodsView from 'view/goods'
import UnitView from 'view/unit'
import MapView from 'view/map'
import UnitMapView from 'view/map/unit'

import Dialog from 'view/ui/dialog'


const cargoScale = .6

const initialize = () => {
	const unitName = Text.create('')
	const gotoText = Text.create('Go to')
	const foundColony = Text.create('Found colony')
	const buildRoadText = Text.create('Build road')
	const plowText = Text.create('Plow')
	const cutForestText = Text.create('Cut down forest')
	const trade = Text.create('Trade route')

	unitName.x = 10
	gotoText.x = 10
	foundColony.x = 10
	buildRoadText.x = 10
	plowText.x = 10
	cutForestText.x = 10
	trade.x = 10

	gotoText.visible = false
	foundColony.visible = false
	buildRoadText.visible = false
	plowText.visible = false
	cutForestText.visible = false
	trade.visible = false

	gotoText.buttonMode = true
	foundColony.buttonMode = true
	buildRoadText.buttonMode = true
	plowText.buttonMode = true
	cutForestText.buttonMode = true
	trade.buttonMode = true

	const container = new PIXI.Container()
	container.x = 10

	UnitMapView.listen.selectedView(view => {
		if (view) {
			const unit = view.unit
			unitName.text = `${Unit.name(unit)}`
			unitName.buttonMode = true
			const unsubscribeClick = Util.mergeFunctions([
				Click.on(unitName, () => {
					MapView.centerAt(unit.mapCoordinates, 350)
				}),
				Click.on(foundColony, () => {
					Commander.scheduleInstead(unit.commander, Found.create(unit))
				}),
				Click.on(buildRoadText, () => {
					Commander.scheduleInstead(unit.commander, Road.create(unit))
				}),
				Click.on(plowText, () => {
					Commander.scheduleInstead(unit.commander, Plow.create(unit))
				}),
				Click.on(cutForestText, () => {
					Commander.scheduleInstead(unit.commander, CutForest.create(unit))
				}),
				Click.on(trade, () => {
					Commander.scheduleInstead(unit.commander, TradeRoute.create(unit))
				}),
				Click.on(gotoText, () => {
					if (unit.domain === 'sea') {
						const colonies = Record.getAll('colony').filter(Colony.isCoastal)
						Dialog.create({
							type: 'naval',
							text: 'Where shall we go?',
							options: colonies.map(colony => ({
								text: `${colony.name} (${colony.colonists.length})`,
								action: () => {
									Commander.scheduleInstead(unit.commander, MoveTo.create(unit, colony.mapCoordinates))
								}
							})).concat([{
								text: 'London',
								margin: true,
								action: () => {
									const pathToHighSeas = PathFinder.findHighSeas(unit.tile)
									const target = pathToHighSeas[pathToHighSeas.length - 1]
									Commander.scheduleInstead(unit.commander, MoveTo.create(unit, target.mapCoordinates))
									Commander.scheduleBehind(unit.commander, Europe.create(unit))
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
									Commander.scheduleInstead(unit.commander, MoveTo.create(unit, colony.mapCoordinates))
								}
							}))
						})
					}
				})
			])


			const updateCommands = () => {
				const moving = unit.mapCoordinates.x !== unit.tile.mapCoordinates.x || unit.mapCoordinates.y !== unit.tile.mapCoordinates.y
				gotoText.visible = true
				foundColony.visible = unit.properties.canFound && !moving && !Tile.radius(unit.tile).some(tile => tile.colony) && !unit.tile.settlement
				buildRoadText.visible = unit.properties.canTerraform && !moving && !unit.tile.road && !unit.tile.settlement
				plowText.visible = unit.properties.canTerraform && !moving && !unit.tile.forest && !unit.tile.plowed && !unit.tile.settlement
				cutForestText.visible = unit.properties.canTerraform && !moving && unit.tile.forest && !unit.tile.settlement
				trade.visible = unit.properties.cargo > 0 && unit.passengers.length === 0
			}
			
			const unsubscribeCoords = Unit.listen.mapCoordinates(unit, updateCommands)
			const unsubscribeTile = Unit.listen.tile(unit, updateCommands)

			Foreground.get().notifications.addChild(unitName)
			Foreground.get().notifications.addChild(gotoText)
			Foreground.get().notifications.addChild(foundColony)
			Foreground.get().notifications.addChild(buildRoadText)
			Foreground.get().notifications.addChild(plowText)
			Foreground.get().notifications.addChild(cutForestText)
			Foreground.get().notifications.addChild(trade)

			Foreground.get().notifications.addChild(container)
			const unsubscribePassengersAndStorage = Unit.listen.passengers(unit, passengers => {
				let index = 0
				const unsubscribePassengers = Util.mergeFunctions(passengers.map(passenger => {
					const view = UnitView.create(passenger)
					const sprite = view.sprite
					sprite.x = index * cargoScale * 32 - 8
					sprite.y = 0
					sprite.scale.set(cargoScale)
					container.addChild(sprite)

					index += 1
	
					return () => {
						view.unsubscribe()
						container.removeChild(sprite)
					}
				}))

				let unsubscribeTreasure = () => {}
				if (unit.treasure) {
					const treasureText = Text.create(unit.treasure)
					treasureText.x = 10
					Foreground.get().notifications.addChild(treasureText)
					unsubscribeTreasure = Util.mergeFunctions([
						RenderView.listen.dimensions(dimensions => {
							treasureText.y = dimensions.y - 60
						}),
						() =>	Foreground.get().notifications.removeChild(treasureText)
					])
				}

				const storage = unit.properties.cargo > 0 ? unit.storage : unit.equipment
				const unsubscribeStorage = Storage.listen(storage, storage => {
					const goods = Storage.goods(storage).filter(pack => pack.amount > 0)
					let storageIndex = 0

					return Util.mergeFunctions(goods.map(pack => {
						const view = GoodsView.create(pack)
						const offset = index * cargoScale * 32 + (index > 0 ? 20 : 0)
						view.sprite.x = offset + storageIndex * cargoScale * 95 + 5 + 0.25 * view.number.width
						view.sprite.y = 0
						view.sprite.scale.set(cargoScale)
						view.number.x = offset + storageIndex * cargoScale * 95
						view.number.y = 10
						view.number.scale.set(cargoScale)

						storageIndex += 1

						container.addChild(view.number)
						container.addChild(view.sprite)

						return () => {
							container.removeChild(view.number)
							container.removeChild(view.sprite)
						}
					}))
				})

				return () => {
					unsubscribeTreasure()
					unsubscribePassengers()
					unsubscribeStorage()
					unsubscribeCoords()
					unsubscribeTile()
					unsubscribeClick()
				}
			})

			return () => {
				Foreground.get().notifications.removeChild(unitName)
				Foreground.get().notifications.removeChild(gotoText)
				Foreground.get().notifications.removeChild(foundColony)
				Foreground.get().notifications.removeChild(buildRoadText)
				Foreground.get().notifications.removeChild(plowText)
				Foreground.get().notifications.removeChild(cutForestText)
				Foreground.get().notifications.removeChild(trade)
				Foreground.get().notifications.removeChild(container)
				unsubscribePassengersAndStorage()
			}
		}
	})

	const offset = 60
	const lineHeight = 36
	RenderView.updateWhenResized(({ dimensions }) => {
		container.y = dimensions.y - offset
		unitName.y = dimensions.y - offset - 1 * lineHeight
		gotoText.y = dimensions.y - offset - 2 * lineHeight - 20
		trade.y = dimensions.y - offset - 3 * lineHeight - 20
		foundColony.y = dimensions.y - offset - 3 * lineHeight - 20
		buildRoadText.y = dimensions.y - offset - 4 * lineHeight - 20
		plowText.y = dimensions.y - offset - 5 * lineHeight - 20
		cutForestText.y = dimensions.y - offset - 5 * lineHeight - 20
	})
}

export default { initialize }