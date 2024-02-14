import { createEffect, createComputed, Show } from 'solid-js'

import Util from 'util/util'
import Record from 'util/record'

import Tile from 'entity/tile'
import Unit from 'entity/unit'
import Colony from 'entity/colony'

import Commander from 'command/commander'
import Found from 'command/found'
import Road from 'command/road'
import Plow from 'command/plow'
import CutForest from 'command/cutForest'
import TradeRoute from 'command/tradeRoute'
import GoTo from 'command/goTo'
import TriggerEvent from 'command/triggerEvent'

import Foreground from 'render/foreground'

import GoodsView from 'view/goods'
import UnitView from 'view/unit'
import Icon from 'view/ui/icon'
import MapView from 'view/map'

import Dialog from 'view/ui/dialog'



import Signal from 'util/signal'

import Storage from 'entity/storage'

import UnitMapView from 'view/map/unit'

import StorageGoods from 'ui/components/StorageGoods'

import styles from './Unit.module.scss'


const handleGoTo = unit => {
  const area = Unit.area(unit)
  const colonies = Record.getAll('colony')
    .filter(colony => Colony.isReachable(colony, unit))
    .map(colony => ({
      ...colony,
      size: colony.colonists.length,
      action: () => {
        Commander.scheduleInstead(unit.commander, GoTo.create({ unit, colony }))
      }
    }))

  if (unit.domain === 'sea') {
    Dialog.open('unit.goto.sea', {
      colonies,
      homeport: {
        name: 'London',
        action: () => {
          Commander.scheduleInstead(unit.commander, GoTo.create({ unit, europe: true }))
        }
      }
    })
  } else {
    Dialog.open('unit.goto.land', {
      colonies
    })
  }
}

const commands = unit => {
	if (!unit) {
		return []
	}

  const pioneering = ['cutForest', 'plow', 'road'].includes(unit.command.id)
  const trading = unit.command.id === 'tradeRoute'
  const moving = !unit.tile

  const gotoTextVisible = !pioneering
  const foundColonyVisible =
    unit.properties.canFound &&
    !moving &&
    !Tile.radius(unit.tile).some(tile => tile.colony) &&
    !unit.tile.settlement &&
    !pioneering
  const buildRoadTextVisible =
    unit.properties.canTerraform &&
    !moving &&
    !unit.tile.road &&
    !unit.tile.settlement &&
    !pioneering
  const plowTextVisible =
    unit.properties.canTerraform &&
    !moving &&
    !unit.tile.forest &&
    !unit.tile.plowed &&
    !unit.tile.settlement &&
    !pioneering
  const cutForestTextVisible =
    unit.properties.canTerraform &&
    !moving &&
    unit.tile.forest &&
    !unit.tile.settlement &&
    !pioneering

  const tradeVisible =
    unit.properties.cargo > 0 && unit.passengers.length === 0 && !pioneering && !trading

  const command = (text, handler) => () => <div onClick={handler}>{text()}</div>

  const cancelCommandName = {
    cutForest: 'Cancel cutting forest',
    plow: 'Cancel plow',
    tradeRoute: 'Cancel trade route',
  }[unit.command.id]

  const foundColony = unit =>
    Commander.scheduleInstead(unit.commander, Found.create({ unit }))
  const trade = unit =>
    Commander.scheduleInstead(unit.commander, TradeRoute.create({ unit }))
  const buildRoad = unit =>
    Commander.scheduleInstead(unit.commander, Road.create({ unit }))
  const cutForest = unit =>
    Commander.scheduleInstead(unit.commander, CutForest.create({ unit }))
  const plow = unit =>
    Commander.scheduleInstead(unit.commander, Plow.create({ unit }))
  const goTo = unit => handleGoTo(unit)
  const cancel = unit => Commander.clearSchedule(unit.commander)

  return [
    foundColonyVisible && ['Found Colony', foundColony],
    gotoTextVisible && ['Go to', goTo],
    tradeVisible && ['Assign automatic Transport', trade],
    plowTextVisible && ['Build Farm', plow],
    buildRoadTextVisible && ['Build Road', buildRoad],
    cutForestTextVisible && ['Cut Forest', cutForest],
    cancelCommandName && [cancelCommandName, cancel],
  ].filter(x => x)
}


function UnitComponent() {
	const unitListener = Signal.map(UnitMapView.listen.selectedView, view => view?.unit)
	const unit = Signal.create(unitListener)
	const name = () => unit() && Unit.name(unit())

	console.log(Signal)
	const command = Signal.create(
		Signal.concat(unitListener, Unit.listen.command) // listens to the changes of the command
	)
	const storage = Signal.create(
		Signal.concat(
			Signal.map(unitListener, unit => unit?.storage), // listens to the storage of a unit
			Storage.listen // listens to the changes of the storage
		)
	)

	const screen = Signal.create(Foreground.listen.screen)
	const isVisible = () => !screen() && !!unit()

	createEffect(() => {
		console.log('unit', unit())
	})
	createEffect(() => {
		console.log('command', command())
	})
	createEffect(() => {
		console.log('storage', storage())
	})
	createEffect(() => {
		console.log('visible', isVisible())
	})

	return (
		<Show when={isVisible()}>
			<div class={styles.main}>
				<div>{name()}</div>
				<div>{command()?.display}</div>
				<StorageGoods goods={storage()} />
			</div>
		</Show>
	)
}

export default UnitComponent