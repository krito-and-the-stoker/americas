import { createEffect, Show } from 'solid-js'

import Storage from 'entity/storage'

import Foreground from 'render/foreground'
import Signal from 'util/xsignal'

import ProductionGoods from 'ui/components/ProductionGoods'

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

	return <Show when={colony()}>
		<div class={styles.name}>{colony()?.name}</div>
		<div class={styles.hoverBox}>
			<div class={styles.title}>Production and Consumption</div>
			<ProductionGoods goods={productionSummary()} />
		</div>
	</Show>
}

export default ColonyComponent