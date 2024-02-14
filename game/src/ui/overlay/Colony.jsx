import { createEffect, Show } from 'solid-js'

import Util from 'util/util'

import Storage from 'entity/storage'
import Colony from 'entity/colony'

import Foreground from 'render/foreground'
import Signal from 'util/signal'

import ProductionGoods from 'ui/components/ProductionGoods'
import StorageGoods from 'ui/components/StorageGoods'

import styles from './Colony.module.scss'


function ColonyComponent() {
	const screen = Signal.create(Foreground.listen.screen)
	const colonySignal = Signal.map(
		Foreground.listen.screen,
		screen => screen?.params?.colony
	)

	const colony = Signal.create(colonySignal)
	const productionSummary = Signal.create(
		Signal.chain(
			Signal.map(colonySignal, colony => colony?.productionSummary),
			Storage.listen
		)
	)

	const [construction, constructionTarget] = Signal.create(
		Signal.chain(
			colonySignal,
			[
				Colony.listen.construction,
				Colony.listen.constructionTarget
			]
		)
	)

	const target = () => construction() && construction()[constructionTarget()]

	const costSum = () => Util.sum(Object.values(target()?.cost ?? []))
	const cost = () => target()?.cost
	const progressPercentage = () => 100 * target()?.progress / costSum()
	const name = () => target()?.name

	const [bells, colonists] = Signal.create(
		Signal.chain(
			colonySignal,
			[
				Colony.listen.bells,
				Colony.listen.colonists
			]
		)
	)
	// make sure bells and colonists are evaluated for tracking
  const rebels = () => (bells() || bells() === 0) && colonists() && Colony.rebels(colony())
  const tories = () => (bells() || bells() === 0) && colonists() && Colony.tories(colony())

	return <Show when={colony()}>
		<div class={styles.name}>{colony()?.name}</div>
		<div class={styles.hoverBox}>
			<div class={styles.title}>Production and Consumption</div>
			<ProductionGoods goods={productionSummary()} />
			<div class={styles.construction}>
				<div>Construction</div>
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
		</div>
	</Show>
}

export default ColonyComponent