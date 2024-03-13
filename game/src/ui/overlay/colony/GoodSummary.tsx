import type { ColonyEntity } from 'entity/colony'
import type { Function1 } from 'util/types'
import type { UnitEntity } from '../Unit'
import type { ColonistEntity } from 'ui/overlay/colony/ColonistSummary'

import { For, Show } from 'solid-js'

import Signal from 'util/signal-ts'
import Util from 'util/util'

import Hover from 'input/hover'

import Storage from 'entity/storage'

import Foreground from 'render/foreground'

import GameIcon from 'ui/components/GameIcon'
import ProductionGoods from 'ui/components/ProductionGoods'

import styles from './GoodSummary.module.scss'

type StorageEntity = {
	[key: string]: number
}


type HoverData = {
	good?: string
}

type Screen = {
	params?: {
		colony: ColonyEntity
	}
}

const displayName = (good: string) => {
	return good[0].toUpperCase() + good.substring(1).replace(/[A-Z]/g, match => ` ${match}`)
}

function GoodSummary() {
	const goodChain = Signal.chain(
		Hover.listen.data,
		Signal.select((data: HoverData) => data?.good)
	)
	const good = Signal.createSolid(
		goodChain,
		Signal.select(x => x ?? '')
	)

	const colonyChain = Signal.chain(
		Foreground.listen.screen,
		Signal.select((screen: Screen) => screen?.params?.colony),
	)

	const storageChain = (storageMapping: Function1<ColonistEntity, StorageEntity>) => Signal.chain(
		colonyChain,
		Signal.assert.not.isNothing(
			Signal.key('colonists'),
			Signal.each(
				Signal.combine(
					Signal.select<ColonistEntity>(),
					Signal.chain(
						Signal.select(storageMapping),
						Storage.signal,
						Signal.select<StorageEntity>()
					),
					goodChain
				),
				Signal.select(([colonist, storage, good]) => ({
					colonist: colonist,
					goods: good ? storage[good] : 0
				}))
			),
		)
	)

	function filterPositiveGoods<T extends { goods: number }>(items: T[]) {
		return items.filter(item => item.goods > 0)
	}
	function filterNegativeGoods<T extends { goods: number }>(items: T[]) {
		return items.filter(item => item.goods < 0)
	}
	function selectUnits<T extends { colonist: ColonistEntity }>(items: T[]) {
		return items.map(item => item.colonist.unit)
	}
	function invertGoods<T extends { goods: number }>(items: T[]) {
		return items.map(item => ({
			...item,
			goods: -item.goods
		}))
	}

	const production = Signal.createSolid(
		storageChain(colonist => colonist.productionSummary),
		Signal.maybe.select(filterPositiveGoods),
		Signal.maybe.select(items => items.map(item => item.goods)),
		Signal.maybe.select(Util.sum),
		Signal.select(x => x ?? 0)
	)

	const producers = Signal.createSolid(
		storageChain(colonist => colonist.productionSummary),
		Signal.maybe.select(filterPositiveGoods),
		Signal.maybe.select(selectUnits),
		Signal.select(units => units ?? [])
	)

	const manufacturing = Signal.createSolid(
		storageChain(colonist => colonist.productionSummary),
		Signal.maybe.select(invertGoods),
		Signal.maybe.select(filterPositiveGoods),
		Signal.maybe.select(items => items.map(item => item.goods)),
		Signal.maybe.select(Util.sum),
		Signal.select(x => x ?? 0)
	)

	const manufacturers = Signal.createSolid(
		storageChain(colonist => colonist.productionSummary),
		Signal.maybe.select(filterNegativeGoods),
		Signal.maybe.select(selectUnits),
		Signal.select(units => units ?? [])
	)

	const consumption = Signal.createSolid(
		storageChain(colonist => colonist.consumptionSummary),
		Signal.maybe.select(invertGoods),
		Signal.maybe.select(items => items.map(item => item.goods)),
		Signal.maybe.select(Util.sum),
		Signal.select(x => x ?? 0)
	)

	const consumers = Signal.createSolid(
		storageChain(colonist => colonist.consumptionSummary),
		Signal.maybe.select(filterNegativeGoods),
		Signal.maybe.select(selectUnits),
		Signal.select(units => units ?? [])
	)

	const supportChain = Signal.chain(
		colonyChain,
		Signal.assert.not.isNothing(
			Signal.key('supportedUnits'),
			Signal.each(
				Signal.combine(
					Signal.select(),
					Signal.chain(
						Signal.select((unit: UnitEntity) => unit.consumptionSummary),
						Storage.signal,
					),
					goodChain,
				),
				Signal.select(([unit, storage, good]) => ({
					unit: unit as UnitEntity,
					goods: good ? (storage as StorageEntity)[good] : 0
				}))
			)
		)
	)

	const support = Signal.createSolid(
		supportChain,
		Signal.select(items => items ? Util.sum(items.map(item => -item.goods)) : 0)
	)

	const supported = Signal.createSolid(
		supportChain,
		Signal.select(items => items?.filter(item => item.goods < 0).map(item => item.unit) ?? [])
	)

	const amount = Signal.createSolid(
		colonyChain,
		Signal.assert.not.isNothing(
			Signal.select(colony => colony.storage),
			Signal.combine(
				Storage.signal,
				goodChain
			),
			Signal.select(([storage, good]) => good ? Math.round((storage as StorageEntity)[good]) : undefined)
		)
	)

	const reserve = Signal.createSolid(
		colonyChain,
		Signal.assert.not.isNothing(
			Signal.key('colonists'),
			Signal.each(
				Signal.select((colonist: ColonistEntity) => colonist.storage),
				Signal.combine(
					Storage.signal,
					goodChain
				),
				Signal.select(([storage, good]) => good ? (storage as StorageEntity)[good] : 0)
			),
			Signal.select(Util.sum),
			Signal.select(Math.round)
		),
		Signal.select(x => x ?? 0)
	)


	return <Show when={good()}>
		<div class={styles.title}>{displayName(good())}</div>
		<div class={styles.summary}>
			<div class={styles.amount}><b>{amount()}</b><GameIcon good={good()} /></div>
			<div><ProductionGoods goods={{ [good()]: production() - manufacturing() - consumption() - support()}} /></div>
		</div>
		<Show when={reserve() > 0}>
			<div>
				<div class={styles.subtitle}>Personal Reserve</div>
				<div class={styles.amount}>{reserve()}<GameIcon good={good()} /></div>
			</div>
		</Show>
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
		<Show when={support() > 0}>
			<div class={styles.subtitle}>Supported Units</div>
			<ProductionGoods goods={{ [good()]: support() }} />
			<div class={styles.units}>
				<For each={supported()}>
					{unit => <GameIcon unit={unit} scale={1.5} />}
				</For>
			</div>
		</Show>
	</Show>
}

export default GoodSummary