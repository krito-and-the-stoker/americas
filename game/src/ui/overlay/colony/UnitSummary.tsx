import { Show } from 'solid-js'
import Util from 'util/util'
import Signal from 'util/signal-ts'

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
	const unitChain = Signal.chain(
		Hover.listen.data,
		Signal.select((data: HoverData) => data?.unit)
	)

	const unit = Signal.createSolid(unitChain)

	const name = Signal.createSolid(
		unitChain,
		Signal.assert.not.isNothing(
			Signal.combine(
				Signal.select(),
				Signal.maybe.listen.key('properties'),
				Signal.maybe.listen.key('expert'),
			),
			Signal.select(([unit]) => Unit.name(unit) as string)
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

	const consumption = Signal.createSolid(
		unitChain,
		Signal.assert.not.isNothing(
			Signal.select(unit => unit.consumptionSummary),
			Storage.signal,
			Signal.select(invertQuantities),
			Signal.select(filterPositive),
		)
	)

	const equipmentChain = Signal.chain(
		unitChain,
		Signal.assert.not.isNothing(
			Signal.select(unit => unit.equipment),
			Storage.signal,
			Signal.select(filterPositive)
		),
	)

	const equipment = Signal.createSolid(equipmentChain)
	const equipmentPercentage = Signal.createSolid(
		Signal.combine(
			Signal.chain(
				equipmentChain,
				Signal.maybe.select(sumAmounts),
				Signal.select(x => x ?? 0)
			),
			Signal.chain(
				Signal.combine(
					Signal.chain(
						unitChain,
						Signal.assert.not.isNothing(
							Signal.listen.key('properties'),
							Signal.listen.key('equipment'),
							Signal.maybe.select(sumAmounts)
						),
						Signal.select(x => x ?? 0),
					),
					Signal.chain(
						unitChain,
						Signal.assert.not.isNothing(
							Signal.listen.key('properties'),
							Signal.select(properties => properties.needsFood ? 20 : 0)
						),
						Signal.select(x => x ?? 0)
					),
				),
				Signal.select(([equipment, food]) => equipment + food),
			)
		),
		Signal.select(([has, need]) => need ? 100.0 * has / need : 0)
	)

	const cargoChain = Signal.chain(
		unitChain,
		Signal.assert.not.isNothing(
			Signal.select(unit => unit.storage),
			Storage.signal,
			Signal.select(filterPositive)
		)
	)
	const cargo = Signal.createSolid(cargoChain)
	const cargoPercentage = Signal.createSolid(
		Signal.combine(
			Signal.chain(
				cargoChain,
				Signal.maybe.select(sumAmounts),
				Signal.select(x => x ?? 0)
			),
			Signal.chain(
				unitChain,
				Signal.assert.not.isNothing(
					Signal.listen.key('properties'),
					Signal.listen.key('cargo'),
				)
			)
		),
		Signal.select(([has, capacity]) => capacity ? 100.0 * has / capacity : 0)
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
