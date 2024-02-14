import { createEffect, createComputed, Show } from 'solid-js'

import Signal from 'util/signal'
import Record from 'util/record'
import Util from 'util/util'

import Storage from 'entity/storage'
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

import Foreground from 'render/foreground'

import UnitMapView from 'view/map/unit'

import Dialog from 'view/ui/dialog'
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



const foundColony = unit =>
  Commander.scheduleInstead(unit.commander, Found.create({ unit }))
const assignTransport = unit =>
  Commander.scheduleInstead(unit.commander, TradeRoute.create({ unit }))
const buildRoad = unit =>
  Commander.scheduleInstead(unit.commander, Road.create({ unit }))
const cutForest = unit =>
  Commander.scheduleInstead(unit.commander, CutForest.create({ unit }))
const plow = unit =>
  Commander.scheduleInstead(unit.commander, Plow.create({ unit }))
const goTo = unit => handleGoTo(unit)
const cancel = unit => Commander.clearSchedule(unit.commander)

function UnitComponent() {
	const unitListener = Signal.map(UnitMapView.listen.selectedView, view => view?.unit)
	const unit = Signal.create(unitListener)
	const name = () => unit() && Unit.name(unit())

	const command = Signal.create(
		Signal.concat(unitListener, Unit.listen.command) // listens to the changes of the command
	)
	const storage = Signal.create(
		Signal.concat(
			Signal.map(unitListener, unit => unit?.storage), // listens to the storage of a unit
			Storage.listen // listens to the changes of the storage
		)
	)
	const equipment = Signal.create(
		Signal.concat(
			Signal.map(unitListener, unit => unit?.equipment),
			Storage.listen
		)
	)

	const passengers = Signal.create(
		Signal.concat(
			unitListener,
			Unit.listen.passengers
		)
	)

	const properties = Signal.create(
		Signal.concat(
			unitListener,
			Unit.listen.properties
		)
	)

	const screen = Signal.create(Foreground.listen.screen)
	const isVisible = () => !screen() && !!unit()

	const supplyColony = Signal.create(
		Signal.map(
			Signal.concat(
				unitListener,
				Unit.listen.mapCoordinates
			),
			coords => Tile.supportingColony(Tile.closest(coords))
		)
	)

	const supplyColonyText = () => supplyColony()
    ? `Supplies from ${supplyColony().name}`
    : 'No external supplies'


  const tile = Signal.create(
  	Signal.concat(unitListener, Unit.listen.tile)
  )

  const isPioneering = () => ['cutForest', 'plow', 'road'].includes(command()?.id)
  const isTrading = () => command()?.id === 'tradeRoute'
  const isMoving = () => !tile()

  const canFoundColony = () =>
    properties()?.canFound &&
    !isMoving() &&
    !Tile.radius(tile()).some(tile => tile.colony) &&
    !tile()?.settlement &&
    !isPioneering()
  const canGoto = () => !isPioneering()
  const canAssignTransport = () =>
    properties()?.cargo > 0 && passengers()?.length === 0 && !isPioneering() && !isTrading()
  const canPioneer = () =>
  	properties()?.canTerraform &&
  	!isMoving() &&
  	!isPioneering()
  	!tile()?.settlement
  const canBuildRoad = () =>
  	canPioneer() &&
  	!tile()?.road
  const canPlow = () =>
  	canPioneer() &&
  	!tile()?.forest &&
  	!tile()?.plowed
  const canCutForest = () =>
  	canPioneer() &&
  	!tile()?.forest

  const cancelCommandName = () => ({
    cutForest: 'Cancel cutting forest',
    plow: 'Cancel plow',
    tradeRoute: 'Cancel trade route',
  })[command()?.id]


  const commands = () => [
    canFoundColony() && ['Found Colony', foundColony],
    canGoto() && ['Go to', goTo],
    canAssignTransport() && ['Assign automatic Transport', assignTransport],
    canPlow() && ['Build Farm', plow],
    canBuildRoad() && ['Build Road', buildRoad],
    canCutForest() && ['Cut Forest', cutForest],
    cancelCommandName() && [cancelCommandName(), cancel],
  ].filter(x => !!x)

	return (
		<Show when={isVisible()}>
			<div class={styles.main}>
				<For each={commands()}>
					{([text, action]) => <div onClick={() => action(unit())}>{text}</div>}
				</For>
				<div>{name()}</div>
				<div>{command()?.display}</div>
				<StorageGoods goods={storage()} />
				<div>{supplyColonyText()}</div>
				<StorageGoods goods={equipment()} />
			</div>
		</Show>
	)
}

export default UnitComponent