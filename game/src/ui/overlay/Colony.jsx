import { createEffect, Show } from 'solid-js'

import Util from 'util/util'

import Storage from 'entity/storage'
import Colony from 'entity/colony'

import Foreground from 'render/foreground'
import Signal from 'util/xsignal'

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

	createEffect(() => {
		console.log(construction())
		console.log(constructionTarget())
	})

	return <Show when={colony()}>
		<div class={styles.name}>{colony()?.name}</div>
		<div class={styles.hoverBox}>
			<div class={styles.title}>Production and Consumption</div>
			<ProductionGoods goods={productionSummary()} />
			<div class={styles.construction}>
				<div>Construction</div>
				<span><i>{name()}</i></span>
				<StorageGoods goods={cost()} />
				<span>{progressPercentage()?.toFixed(0)}%</span>
			</div>
		</div>
	</Show>
}

export default ColonyComponent