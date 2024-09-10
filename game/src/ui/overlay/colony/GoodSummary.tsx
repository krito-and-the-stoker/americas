import type { ColonyEntity } from 'entity/colony/types'
import type { Function1 } from 'util/types'
import { UnitEntity } from 'entity/unit/types'
import { ColonistEntity } from 'entity/colonist/types'


import { For, Show } from 'solid-js'

import $ from 'signal-chain-solid'
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
	const goodChain = $.chain(
		Hover.listen.data,
		$.select((data: HoverData) => data?.good)
	)
	const good = $.solid.create(
		goodChain,
		$.select(x => x ?? ''),
	)

	const colonyChain = $.chain(
		Foreground.listen.screen,
		$.select((screen: Screen) => screen?.params?.colony),
	)

	const storageChain = (storageMapping: Function1<ColonistEntity, StorageEntity>) => $.chain(
		colonyChain,
		$.type.not.isNothing(
			$.listen.key('colonists'),
			$.each(
				$.combine(
					$.select<ColonistEntity>(),
					$.chain(
						$.select(storageMapping),
						Storage.signal,
						$.select<StorageEntity>()
					),
					goodChain
				),
				$.select(([colonist, storage, good]) => ({
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

	// aka passive production, for horses
	const productionSummaryChain = $.chain(
		colonyChain,
		$.select(colony => colony?.productionSummary),
		$.maybe.chain(
			Storage.signal,
			$.combine(
				$.select<StorageEntity>(),
				goodChain
			),
			$.select(([storage, good]) => good ? storage[good] : 0)
		),
		$.select(x => x ?? 0),
	)

	const productionChain = $.chain(
		storageChain(colonist => colonist.productionSummary),
		$.maybe.select(filterPositiveGoods),
		$.maybe.select(items => items.map(item => item.goods)),
		$.maybe.select(Util.sum),
		$.select(x => x ?? 0)
	)
	const production = $.solid.create(productionChain)

	const producers = $.solid.create(
		storageChain(colonist => colonist.productionSummary),
		$.maybe.select(filterPositiveGoods),
		$.maybe.select(selectUnits),
		$.select(units => units ?? [])
	)

	const manufacturingChain = $.chain(
		storageChain(colonist => colonist.productionSummary),
		$.maybe.select(invertGoods),
		$.maybe.select(filterPositiveGoods),
		$.maybe.select(items => items.map(item => item.goods)),
		$.maybe.select(Util.sum),
		$.select(x => x ?? 0)
	)
	const manufacturing = $.solid.create(manufacturingChain)

	const manufacturers = $.solid.create(
		storageChain(colonist => colonist.productionSummary),
		$.maybe.select(filterNegativeGoods),
		$.maybe.select(selectUnits),
		$.select(units => units ?? [])
	)

	const consumptionChain = $.chain(
		storageChain(colonist => colonist.consumptionSummary),
		$.maybe.select(invertGoods),
		$.maybe.select(items => items.map(item => item.goods)),
		$.maybe.select(Util.sum),
		$.select(x => x ?? 0)
	)
	const consumption = $.solid.create(consumptionChain)

	const consumers = $.solid.create(
		storageChain(colonist => colonist.consumptionSummary),
		$.maybe.select(filterNegativeGoods),
		$.maybe.select(selectUnits),
		$.select(units => units ?? [])
	)

	const supportChain = $.chain(
		colonyChain,
		$.type.not.isNothing(
			$.listen.key('supportedUnits'),
			$.each(
				$.combine(
					$.select(),
					$.chain(
						$.select((unit: UnitEntity) => unit.consumptionSummary),
						Storage.signal,
					),
					goodChain,
				),
				$.select(([unit, storage, good]) => ({
					unit: unit as UnitEntity,
					goods: good ? (storage as StorageEntity)[good] : 0
				}))
			)
		)
	)

	const growth = $.solid.create(
		$.combine(
			productionSummaryChain, // total amount
			productionChain, // sum of colonists
			manufacturingChain, // sum of colonists
			consumptionChain, // sum of colonists
			$.chain(
				supportChain,
				$.select(items => items ? Util.sum(items.map(item => -item.goods)) : 0)
			)
		),
		$.select(([summary, production, manufacturing, consumption, support]) => summary - production + manufacturing + consumption + support),
		$.select(Math.round),
	)

	const support = $.solid.create(
		supportChain,
		$.select(items => items ? Util.sum(items.map(item => -item.goods)) : 0)
	)

	const supported = $.solid.create(
		supportChain,
		$.select(items => items?.filter(item => item.goods < 0).map(item => item.unit) ?? [])
	)

	const amount = $.solid.create(
		colonyChain,
		$.type.not.isNothing(
			$.select(colony => colony.storage),
			$.combine(
				Storage.signal,
				goodChain
			),
			$.select(([storage, good]) => good ? Math.round((storage as StorageEntity)[good]) : undefined)
		)
	)

	const reserve = $.solid.create(
		colonyChain,
		$.type.not.isNothing(
			$.listen.key('colonists'),
			$.each(
				$.select((colonist: ColonistEntity) => colonist.storage),
				$.combine(
					Storage.signal,
					goodChain
				),
				$.select(([storage, good]) => good ? (storage as StorageEntity)[good] : 0)
			),
			$.select(Util.sum),
			$.select(Math.round)
		),
		$.select(x => x ?? 0)
	)


	return <Show when={good()}>
		<div class={styles.title}>{displayName(good())}</div>
		<div class={styles.summary}>
			<div class={styles.amount}><b>{amount()}</b><GameIcon good={good()} /></div>
			<div><ProductionGoods goods={{ [good()]: growth() + production() - manufacturing() - consumption() - support()}} /></div>
		</div>
		<Show when={reserve() > 0}>
			<div>
				<div class={styles.subtitle}>Personal Reserve</div>
				<div class={styles.amount}>{reserve()}<GameIcon good={good()} /></div>
			</div>
		</Show>
		<Show when={growth() > 0}>
			<div class={styles.subtitle}>Growth</div>
			<ProductionGoods goods={{ [good()]: growth() }} />
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