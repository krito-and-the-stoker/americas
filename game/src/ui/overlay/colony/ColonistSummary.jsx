import { createEffect } from 'solid-js'


import Signal from 'util/signal'

import Storage from 'entity/storage'
import Colonist from 'entity/colonist'
import Unit from 'entity/unit'

import Hover from 'input/hover'

import ProductionGoods from 'ui/components/ProductionGoods'
import StorageGoods from 'ui/components/StorageGoods'
import GameIcon from 'ui/components/GameIcon'
import styles from './ColonistSummary.module.scss'



function ColonistSummary() {
	const colonist = Signal.create(
		Hover.listen.data,
		Signal.select(data => data?.colonist)
	)

	const [unit, expert, properties] = Signal.create(
		Hover.listen.data,
		Signal.select(data => data?.colonist),
		Colonist.listen.unit,
		[
			Signal.through,
			Unit.listen.expert,
			Unit.listen.properties,
		]
	)

	const name = () => properties() && Unit.name(unit())

	const [production, consumption, storage] = Signal.create(
		Hover.listen.data,
		Signal.select([
			data => data?.colonist?.productionSummary,
			data => data?.colonist?.consumptionSummary,
			data => data?.colonist?.storage,
		]),
		Storage.listen
	)

	const state = Signal.create(
		Hover.listen.data,
		Signal.select(data => data?.colonist),
		Colonist.listen.state,
		Signal.select({
      noFood: state => state.noFood,
      noWood: state => state.noWood,
      noLuxury: state => state.noLuxury,
      isPromoting: state => state.isPromoting,
      hasBonus: state => state.hasBonus,
		})
	)

	const productionOutput = () => {
		if (!production()) {
			return null
		}

		return Object.fromEntries(
			Object.entries(production()).filter(([key, value]) => value > 0)
		)
	}
	const productionInput = () => {
		if (!production()) {
			return null
		}

		return Object.fromEntries(
			Object.entries(production()).filter(([key, value]) => value < 0).map(([key, value]) => ([key, -value]))
		)
	}
	const positiveConsumption = () => {
		if (!consumption()) {
			return null
		}

		return Object.fromEntries(
			Object.entries(consumption()).filter(([_, value]) => value !== 0).map(([key, value]) => ([key, -value]))
		)
	}

	const hasEntries = obj => obj && Object.keys(obj).length > 0


	return <>
		<div class={styles.title}>{name()}</div>
		<div class={styles.colonist}>
			<div class={styles.icon}><GameIcon unit={unit()} scale={2} /></div>
			<div class={styles.state}>
				<div class={styles.power}>Power {Math.round(10 * Colonist.power(colonist()))}</div>
				<Show when={state.noFood()}><div>No Food</div></Show>
				<Show when={state.noWood()}><div>No Wood</div></Show>
				<Show when={state.noLuxury()}><div>No Luxury</div></Show>
				<Show when={state.isPromoting()}><div>Promoting</div></Show>
				<Show when={state.hasBonus()}><div>Bonus</div></Show>
			</div>
		</div>
		<Show when={hasEntries(productionOutput())}>
			<div class={styles.subtitle}>{hasEntries(productionInput()) ? 'Manufacturing' : 'Production'}</div>
			<div class={styles.production}>
				<ProductionGoods goods={productionInput()} />
				<Show when={hasEntries(productionInput())}><span class={styles.arrow}>into</span></Show>
				<ProductionGoods goods={productionOutput()} />
			</div>
		</Show>
		<Show when={hasEntries(positiveConsumption())} fallback={<div class={styles.subtitle}>No Consumption</div>}>
			<div class={styles.subtitle}>Consumption</div>
			<div class={styles.consumption}>
				<ProductionGoods goods={positiveConsumption()} />
			</div>
		</Show>
		<div class={styles.subtitle}>Personal Reserve</div>
		<div class={styles.backup}>
			<StorageGoods goods={storage()} />
		</div>
	</>
}

export default ColonistSummary
