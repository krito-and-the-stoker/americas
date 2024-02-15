import { createEffect } from 'solid-js'


import Util from 'util/util'
import Signal from 'util/signal'

import Storage from 'entity/storage'
import Colonist from 'entity/colonist'
import Unit from 'entity/unit'

import Hover from 'input/hover'

import ProductionGoods from 'ui/components/ProductionGoods'
import StorageGoods from 'ui/components/StorageGoods'
import GameIcon from 'ui/components/GameIcon'

import styles from './UnitSummary.module.scss'


function UnitSummary() {
	const [unit, expert, properties, [consumption, equipment, cargo]] = Signal.create(
		Signal.chain(
			Signal.select(Hover.listen.data, data => data?.unit),
			[
				Signal.through,
				Unit.listen.expert,
				Unit.listen.properties,
				Signal.chain(
					Signal.select(Signal.through, [
						unit => unit?.consumptionSummary,
						unit => unit?.equipment,
						unit => unit?.storage,
					]),
					Storage.listen
				)
			]
		)
	)

	const name = () => properties() && Unit.name(unit())

	const positiveConsumption = () => {
		if (!consumption()) {
			return null
		}

		return Object.fromEntries(
			Object.entries(consumption()).filter(([_, value]) => value < 0).map(([key, value]) => ([key, -value]))
		)
	}

	const hasEntries = obj => obj && Object.keys(obj).length > 0
	const hasPositiveEntries = obj => obj && Object.entries(obj).filter(([_, value]) => value > 0).length > 0

	const summedEquipmentNeed = () => Util.sum(Object.values(properties()?.equipment ?? {})) + (properties()?.needsFood ? 20 : 0)
	const summedEquipmentHas = () => Util.sum(Object.values(equipment() ?? {}).filter(x => x > 0))
	const equipmentPercentage = () => summedEquipmentNeed() ? 100.0 * summedEquipmentHas() / summedEquipmentNeed() : null

	const summedCargo = () => Util.sum(Object.values(cargo() ?? {}).filter(x => x > 0))
	const cargoCapacity = () => properties()?.cargo
	const cargoPercentage = () => cargoCapacity() ? 100.0 * summedCargo() / cargoCapacity() : null


	return <>
		<div class={styles.title}>{name()}</div>
		<div class={styles.unit}>
			<GameIcon unit={unit()} scale={2} />
		</div>
		<Show when={hasEntries(positiveConsumption())}>
			<div class={styles.subtitle}>Consumption</div>
			<div class={styles.consumption}>
				<ProductionGoods goods={positiveConsumption()} />
			</div>
		</Show>
		<Show when={hasPositiveEntries(equipment())}>
			<div class={styles.subtitle}>Equipment {equipmentPercentage()?.toFixed()}%</div>
			<div class={styles.consumption}>
				<StorageGoods goods={equipment()} />
			</div>
		</Show>
		<Show when={hasPositiveEntries(cargo())}>
			<div class={styles.subtitle}>Cargo {cargoPercentage()?.toFixed()}%</div>
			<div class={styles.consumption}>
				<StorageGoods goods={cargo()} />
			</div>
		</Show>
	</>
}

export default UnitSummary
