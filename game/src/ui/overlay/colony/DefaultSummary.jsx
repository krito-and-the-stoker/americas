import { createEffect, Show } from 'solid-js'

import Util from 'util/util'

import Storage from 'entity/storage'
import Colony from 'entity/colony'
import Unit from 'entity/unit'
import Colonist from 'entity/colonist'
import Construction from 'entity/construction'

import Foreground from 'render/foreground'
import Signal from 'util/signal'
import Dialog from 'view/ui/dialog'
import ProductionGoods from 'ui/components/ProductionGoods'
import StorageGoods from 'ui/components/StorageGoods'
import GameIcon from 'ui/components/GameIcon'

import styles from './DefaultSummary.module.scss'

function openConstructionDialog(colony) {
  const options = Construction.options(colony)

  const prepareOption = option => ({
    ...option,
    cost: option.cost(),
    start: () => Construction.start(colony, option),
    percentage: () => Math.floor((100 * option.progress()) / Util.sum(Object.values(option.cost()))),
  })

  Dialog.open('colony.construction', {
    buildings: options.buildings.map(prepareOption),
    units: options.units.map(prepareOption),
    stop: () => Construction.start(colony, null)
  })
}

function DefaultSummary() {
	const colonySignal = Signal.chain(
		Foreground.listen.screen,
		Signal.select(screen => screen?.params?.colony),
	)

	const [colony, productionSummary,construction, constructionTarget] = Signal.create(
		colonySignal,
		[
			Signal.through,
			Signal.chain(
				Signal.select(colony => colony.productionSummary),
				Storage.listen
			),
			Colony.listen.construction,
			Colony.listen.constructionTarget
		]
	)

	const target = () => construction() && construction()[constructionTarget()]

	const costSum = () => Util.sum(Object.values(target()?.cost ?? []))
	const cost = () => target()?.cost
	const progressPercentage = () => 100 * target()?.progress / costSum()
	const name = () => target()?.name

	const [bells, colonists] = Signal.create(
		colonySignal,
		[
			Colony.listen.bells,
			Colony.listen.colonists
		]
	)
	// make sure bells and colonists are evaluated for tracking
  const rebels = () => (bells() || bells() === 0) && colonists() && Colony.rebels(colony())
  const tories = () => (bells() || bells() === 0) && colonists() && Colony.tories(colony())

  const supportedUnits = Signal.create(
  	colonySignal,
  	Colony.listen.supportedUnits,
  	Signal.each(
  		Signal.combine({
  			unit: Signal.through,
  			colony: Signal.chain(
		  		Unit.listen.colonist,
		  		Colonist.listen.colony,
  			)
  		}),
  	),
  	Signal.select(entries => entries.filter(entry => !entry.colony)),
  	Signal.select(entries => entries.map(entry => entry.unit)),
  )


	return <>
		<div class={styles.title}>Production and Consumption</div>
		<ProductionGoods goods={productionSummary()} />
		<div class={styles.construction} onClick={() => openConstructionDialog(colony())}>
			<div class={styles.subtitle}>Construction</div>
			<Show when={target()} fallback={<i>None</i>}>
				<span><i>{name()}</i></span>
				<StorageGoods goods={cost()} />
				<span>{progressPercentage()?.toFixed(0)}%</span>
			</Show>
		</div>
		<div class={styles.colonists}>
			<div classList={{[styles.green]: rebels()?.percentage >= 50}}>
				<i>Integrated</i> {rebels()?.percentage}% ({rebels()?.number} Colonists)
			</div>
			<div classList={{[styles.red]: tories()?.number >= 10}}>
				<i>Unorganized</i> {tories()?.percentage}% ({tories()?.number} Colonists)
			</div>
		</div>
		<Show when={supportedUnits()?.length > 0}>
			<div class={styles.supportTitle}>Supported Units</div>
			<div class={styles.supported}>
				<For each={supportedUnits()}>
					{unit => <GameIcon unit={unit} />}
				</For>
			</div>
		</Show>
	</>
}

export default DefaultSummary