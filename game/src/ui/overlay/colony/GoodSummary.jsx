import { createEffect } from 'solid-js'

import Signal from 'util/signal'
import Util from 'util/util'

import Hover from 'input/hover'

import Storage from 'entity/storage'
import Colony from 'entity/colony'

import Foreground from 'render/foreground'

import GameIcon from 'ui/components/GameIcon'
import ProductionGoods from 'ui/components/ProductionGoods'

import styles from './GoodSummary.module.scss'

const displayName = good => {
	return good[0].toUpperCase() + good.substring(1).replace(/[A-Z]/g, match => ` ${match}`)
}

function GoodSummary() {
	const good = Signal.create(
		Hover.listen.data,
		Signal.select(data => data.good)
	)

	const [production, producers, manufacturing, manufacturers] = Signal.create(
		Foreground.listen.screen,
		Signal.select(screen => screen.params?.colony),
		Colony.listen.colonists,
		Signal.each(
			Signal.combine([
				Signal.through,
				Signal.chain(
					Signal.select(colonist => colonist.productionSummary),
					Storage.listen
				),
				Signal.chain(
					Signal.source(Hover.listen.data),
					Signal.select(data => data.good)
				),
			]),
			Signal.select(([colonist, storage, good]) => ({ colonist, goods: storage[good] }))
		),
		[
			Signal.select(
				items => Util.sum(items.filter(item => item.goods > 0).map(item => item.goods))
			),
			Signal.select(
				items => items.filter(item => item.goods > 0).map(item => item.colonist.unit)
			),
			Signal.select(
				items => Util.sum(items.filter(item => item.goods < 0).map(item => -item.goods))
			),
			Signal.select(
				items => items.filter(item => item.goods < 0).map(item => item.colonist.unit)
			),
		]
	)


	const [consumption, consumers] = Signal.create(
		Foreground.listen.screen,
		Signal.select(screen => screen.params?.colony),
		Colony.listen.colonists,
		Signal.each(
			Signal.combine([
				Signal.through,
				Signal.chain(
					Signal.select(colonist => colonist.consumptionSummary),
					Storage.listen
				),
				Signal.chain(
					Signal.source(Hover.listen.data),
					Signal.select(data => data.good)
				),
			]),
			Signal.select(([colonist, storage, good]) => ({ colonist, goods: -storage[good] }))
		),
		[
			Signal.select(items => Util.sum(items.map(item => item.goods))),
			Signal.select(items => items.filter(item => item.goods > 0).map(item => item.colonist.unit))
		]
	)

	const storage = Signal.create(
		Foreground.listen.screen,
		Signal.select(
			screen => screen?.params?.colony?.storage
		),
		Storage.listen
	)


	const amount = () => storage() && Math.floor(storage()[good()])

	return <Show when={good()}>
		<div class={styles.title}>{displayName(good())}</div>
		<div class={styles.summary}>
			<div class={styles.amount}><b>{amount()}</b><GameIcon good={good()} /></div>
			<div><ProductionGoods goods={{ [good()]: production() - manufacturing() - consumption() }} /></div>
		</div>
		<Show when={production() > 0}>
			<div class={styles.subtitle}>Production</div>
			<ProductionGoods goods={{ [good()]: production() }} />
			<div class={styles.units}>
				<For each={producers()}>
					{unit => <GameIcon unit={unit} scale={1.5} />}
				</For>
			</div>
		</Show>
		<Show when={manufacturing() > 0}>
			<div class={styles.subtitle}>Manufacturing</div>
			<ProductionGoods goods={{ [good()]: manufacturing() }} />
			<div class={styles.units}>
				<For each={manufacturers()}>
					{unit => <GameIcon unit={unit} scale={1.5} />}
				</For>
			</div>
		</Show>
		<Show when={consumption() > 0}>
			<div class={styles.subtitle}>Consumption</div>
			<ProductionGoods goods={{ [good()]: consumption() }} />
			<div class={styles.units}>
				<For each={consumers()}>
					{unit => <GameIcon unit={unit} scale={1.5} />}
				</For>
			</div>
		</Show>
	</Show>
}

export default GoodSummary