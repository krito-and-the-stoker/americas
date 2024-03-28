import { Show } from 'solid-js'
import Util from 'util/util'
import $ from 'signal-chain-solid'

import Storage from 'entity/storage'
import Unit from 'entity/unit'

import Hover from 'input/hover'

import ProductionGoods from 'ui/components/ProductionGoods'
import StorageGoods from 'ui/components/StorageGoods'
import GameIcon from 'ui/components/GameIcon'

import styles from './UnitSummary.module.scss'
import { UnitEntity } from '../Unit'

type HoverData = {
	unit?: UnitEntity
}

type StorageEntity = {
	[key: string]: number
}

function UnitSummary() {
	const unitChain = $.chain(
		Hover.listen.data,
		$.select((data: HoverData) => data?.unit)
	)

	const unit = $.solid.create(unitChain)

	const name = $.solid.create(
		unitChain,
		$.assert.not.isNothing(
			$.combine(
				$.select(),
				$.maybe.listen.key('properties'),
				$.maybe.listen.key('expert'),
			),
			$.select(([unit]) => Unit.name(unit) as string)
		),
	)

	const filterPositive = (obj: StorageEntity) => Object.fromEntries(
		Object.entries(obj)
			.filter(([_, amount]) => amount > 0)
	)
	const invertQuantities = (obj: StorageEntity) => Object.fromEntries(
		Object.entries(obj)
			.map(([good, amount]) => ([good, -amount]))
	)
	const sumAmounts = (obj: StorageEntity) => Util.sum(Object.entries(obj).map(([_, amount]) => amount))

	const consumption = $.solid.create(
		unitChain,
		$.assert.not.isNothing(
			$.select(unit => unit.consumptionSummary),
			Storage.signal,
			$.select(invertQuantities),
			$.select(filterPositive),
		)
	)

	const equipmentChain = $.chain(
		unitChain,
		$.assert.not.isNothing(
			$.select(unit => unit.equipment),
			Storage.signal,
			$.select(filterPositive)
		),
	)

	const equipment = $.solid.create(equipmentChain)
	const equipmentPercentage = $.solid.create(
		$.combine(
			$.chain(
				equipmentChain,
				$.maybe.select(sumAmounts),
				$.select(x => x ?? 0)
			),
			$.chain(
				$.combine(
					$.chain(
						unitChain,
						$.assert.not.isNothing(
							$.listen.key('properties'),
							$.listen.key('equipment'),
							$.maybe.select(sumAmounts)
						),
						$.select(x => x ?? 0),
					),
					$.chain(
						unitChain,
						$.assert.not.isNothing(
							$.listen.key('properties'),
							$.select(properties => properties.needsFood ? 20 : 0)
						),
						$.select(x => x ?? 0)
					),
				),
				$.select(([equipment, food]) => equipment + food),
			)
		),
		$.select(([has, need]) => need ? 100.0 * has / need : 0)
	)

	const cargoChain = $.chain(
		unitChain,
		$.assert.not.isNothing(
			$.select(unit => unit.storage),
			Storage.signal,
			$.select(filterPositive)
		)
	)
	const cargo = $.solid.create(cargoChain)
	const cargoPercentage = $.solid.create(
		$.combine(
			$.chain(
				cargoChain,
				$.maybe.select(sumAmounts),
				$.select(x => x ?? 0)
			),
			$.chain(
				unitChain,
				$.assert.not.isNothing(
					$.listen.key('properties'),
					$.listen.key('cargo'),
				)
			)
		),
		$.select(([has, capacity]) => capacity ? 100.0 * has / capacity : 0)
	)


	const hasEntries = (obj: StorageEntity | undefined) => obj && Object.keys(obj).length > 0
	const hasPositiveEntries = (obj: StorageEntity | undefined) => obj && Object.entries(obj).filter(([_, value]) => value > 0).length > 0


	return <>
		<div class={styles.title}>{name()}</div>
		<div class={styles.unit}>
			<GameIcon unit={unit()} scale={2} />
		</div>
		<Show when={hasEntries(consumption())}>
			<div class={styles.subtitleConsumption}>Consumption</div>
			<div>
				<ProductionGoods goods={consumption()} />
			</div>
		</Show>
		<Show when={hasPositiveEntries(equipment())}>
			<div class={styles.subtitle}>Equipment {equipmentPercentage()?.toFixed()}%</div>
			<div>
				<StorageGoods goods={equipment()} />
			</div>
		</Show>
		<Show when={hasPositiveEntries(cargo())}>
			<div class={styles.subtitle}>Cargo {cargoPercentage()?.toFixed()}%</div>
			<div>
				<StorageGoods goods={cargo()} />
			</div>
		</Show>
	</>
}

export default UnitSummary
