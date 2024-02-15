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
import MapView from 'view/map'

import Dialog from 'view/ui/dialog'
import StorageGoods from 'ui/components/StorageGoods'
import GameIcon from 'ui/components/GameIcon'

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
	const unitListener = Signal.select(UnitMapView.listen.selectedView, view => view?.unit)
	const unit = Signal.create(unitListener)
	const name = () => unit() && Unit.name(unit())

	const [cargo, equipment] = Signal.create(
		Signal.chain(
			Signal.select(unitListener, [
				unit => unit?.storage,
				unit => unit?.equipment
			]),
			Storage.listen
		)
	)

	const [command, passengers, properties, tile, [supplyColony, coords]] = Signal.create(
		Signal.chain(unitListener, [
			Unit.listen.command,
			Unit.listen.passengers,
			Unit.listen.properties,
			Unit.listen.tile,
			Signal.select(
				Unit.listen.mapCoordinates,[
					coords => Tile.supportingColony(Tile.closest(coords)),
					coords => coords
				]
			)
		])
	)

	const strength = () => coords() && equipment() && Unit.strength(unit()).toFixed(2)
	const speed = () => properties() && equipment() && Unit.speed(unit()).toFixed(2)
	const cost = () => properties()?.cost ? properties().cost.toFixed(0) : 0
	const treasure = () => unit()?.treasure

	const screen = Signal.create(Foreground.listen.screen)
	const isVisible = () => !screen() && !!unit()

	const supplyFragment = () => supplyColony()
		? <>Supplies from <b>{supplyColony().name}</b></>
		: <>No external supplies</>

	const supplyColonyText = () => supplyColony()
    ? `Supplies from ${supplyColony().name}`
    : 'No external supplies'

  const center = () => MapView.centerAt(coords(), 350)

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
  	tile()?.forest

  const cancelCommandName = () => ({
    cutForest: 'Cancel Cutting Forest',
    plow: 'Cancel Plow',
    tradeRoute: 'Cancel Automatic Transport',
  })[command()?.id]


  const commands = () => [
    canFoundColony() && ['Found Colony', foundColony],
    canGoto() && ['Go to', goTo],
    canAssignTransport() && ['Assign Automatic Transport', assignTransport],
    canPlow() && ['Build Farm', plow],
    canBuildRoad() && ['Build Road', buildRoad],
    canCutForest() && ['Cut Forest', cutForest],
    cancelCommandName() && [cancelCommandName(), cancel],
  ].filter(x => !!x)

	return (
		<Show when={isVisible()}>
			<div class={styles.main}>
				<div class={styles.commands}>
					<For each={commands()}>
						{([text, action]) => <div onClick={() => action(unit())}>{text}</div>}
					</For>
				</div>
				<div onClick={center} class={styles.name}>{name()}</div>
				<div class={styles.command}><i>{command()?.display}</i></div>
				<div class={styles.properties}>
					<span><GameIcon icon="go" scale="0.75" />{speed()}</span>
					<span><GameIcon icon="combat" scale="0.75" />{strength()}</span>
					<Show when={cost()}>
						<span><GameIcon icon="gold" scale="0.75" />{cost()}</span>
					</Show>
				</div>
				<Show when={treasure()}>
					<div class={styles.treasure}>
						<b>{treasure()}</b><GameIcon icon="gold" />
					</div>
				</Show>
				<div class={styles.cargo}>
					<StorageGoods goods={cargo()} />
				</div>
				<Show when={passengers()?.length > 0}>
					<div class={styles.passengers}>
						<For each={passengers()}>
							{passenger => <div class={styles.passenger}><GameIcon unit={passenger} scale={2} /></div>}
						</For>
					</div>
				</Show>
				<div class={styles.supply}>{supplyFragment()}</div>
				<div class={styles.equipment}><StorageGoods goods={equipment()} /></div>
			</div>
		</Show>
	)
}

export default UnitComponent