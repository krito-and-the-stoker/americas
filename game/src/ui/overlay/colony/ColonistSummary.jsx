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

	const [unit, properties] = Signal.create(
		Hover.listen.data,
		Signal.select(data => data?.colonist),
		Colonist.listen.unit,
		[
			Signal.through,
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

	const colonistSignal = Signal.chain(
		Hover.listen.data,
		Signal.select(data => data?.colonist),
	)

	const state = Signal.create(
		colonistSignal,
		Colonist.listen.state,
		Signal.select({
			noFood: state => state.noFood,
			noWood: state => state.noWood,
			noLuxury: state => state.noLuxury,
			isPromoting: state => state.isPromoting,
			hasBonus: state => state.hasBonus,
		})
	)

	const breakdown = Signal.create(
		colonistSignal,
		Colonist.listen.consumptionBreakdown,
		Signal.select({
			food: breakdown => breakdown.has.food,
			wood: breakdown => breakdown.has.wood,
			luxury: breakdown => breakdown.has.luxury,
			bonus: breakdown => breakdown.has.bonus,
			promotion: breakdown => breakdown.has.promotion,
		})
	)


	const promotionProgress = Signal.create(
		Hover.listen.data,
		Signal.select(data => data?.colonist),
		Colonist.listen.promotion,
		Signal.select(promotion => promotion.target
			&& promotion.progress
			&& promotion.progress[promotion.target]
		),
		Signal.select(progress => Math.floor(100 * progress))
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
				<Show when={state.noFood()}><div class={styles.stateTag}>
					<span>No Food</span>
					<Show when={breakdown.food()}><ProductionGoods scale={0.5} goods={breakdown.food()} /></Show>
				</div></Show>
				<Show when={state.noWood()}><div class={styles.stateTag}>
					<span>No Wood</span>
					<Show when={breakdown.wood()}><ProductionGoods scale={0.5} goods={breakdown.wood()} /></Show>
				</div></Show>
				<Show when={state.noLuxury()}><div class={styles.stateTag}>
					<span>No Luxury</span>
					<Show when={breakdown.luxury()}><ProductionGoods scale={0.5} goods={breakdown.luxury()} /></Show>
				</div></Show>
				<Show when={state.isPromoting()}><div class={styles.stateTag}>
					<span>Promoting {promotionProgress()}%</span>
					<Show when={breakdown.promotion()}><ProductionGoods scale={0.5} goods={breakdown.promotion()} /></Show>
				</div></Show>
				<Show when={state.hasBonus()}><div class={styles.stateTag}>
					<span>Bonus</span>
					<Show when={breakdown.bonus()}><ProductionGoods scale={0.5} goods={breakdown.bonus()} /></Show>
				</div></Show>
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
