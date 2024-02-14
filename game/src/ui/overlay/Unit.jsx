import { createEffect, createComputed, Show } from 'solid-js'

import Util from 'util/util'
import Record from 'util/record'

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
import Icon from 'view/ui/icon'
import MapView from 'view/map'

import Dialog from 'view/ui/dialog'



import Binding from 'util/binding'

import UnitMapView from 'view/map/unit'

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
    tradeVisible && ['Assign automatic Transport', trade],
    buildRoadTextVisible && ['Build Road', buildRoad],
    cutForestTextVisible && ['Cut Forest', cutForest],
    plowTextVisible && ['Build Farm', plow],
    gotoTextVisible && ['Go to', goTo],
    cancelCommandName && [cancelCommandName, cancel],
  ].filter(x => x)
}


function UnitComponent() {
	const [selectedView] = Binding.signal(UnitMapView.listen.selectedView)
	const [screen] = Binding.signal(Foreground.listen.screen)
	const unit = () => selectedView()?.unit
	const isVisible = () => !screen() && !!unit()

	const [unitEntity, setUnitEntity] = Binding.entitySignal(unit(), Unit.listen)
	createComputed(() => {
		setUnitEntity(unit())
	})

	return (
		<Show when={isVisible()}>
			<div class={styles.main}>
				<div>{Unit.name(unitEntity)}</div>
				<For each={commands(unitEntity)}>
					{([text, action]) => <div onClick={() => action(unit())}>{text}</div>}
				</For>
			</div>
		</Show>
	)
}

export default UnitComponent