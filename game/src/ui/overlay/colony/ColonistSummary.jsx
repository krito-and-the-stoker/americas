import { createEffect } from 'solid-js'


import Signal from 'util/signal'

import Storage from 'entity/storage'
import Colonist from 'entity/colonist'
import Unit from 'entity/unit'

import Hover from 'input/hover'

import ProductionGoods from 'ui/components/ProductionGoods'
import GameIcon from 'ui/components/GameIcon'
import styles from './ColonistSummary.module.scss'



function ColonistSummary() {
	const colonist = Signal.create(
		Signal.select(Hover.listen.data, data => data?.colonist)
	)

	const [unit, expert, properties] = Signal.create(
		Signal.chain(
			Signal.select(Hover.listen.data, data => data?.colonist),
			Colonist.listen.unit,
			[
				Signal.through,
				Unit.listen.expert,
				Unit.listen.properties,
			]
		)
	)

	const name = () => properties() && Unit.name(unit())

	const [production, consumption] = Signal.create(
		Signal.chain(
			Signal.select(
				Hover.listen.data,
				[
					data => data?.colonist?.productionSummary,
					data => data?.colonist?.consumptionSummary,
				]
			),
			Storage.listen
		)
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
			Object.entries(consumption()).filter(([_, value]) => value < 0).map(([key, value]) => ([key, -value]))
		)
	}

	const hasEntries = obj => obj && Object.keys(obj).length > 0


	return <>
		<div class={styles.title}>{name()}</div>
		<div class={styles.colonist}>
			<GameIcon unit={unit()} scale={2} />
		</div>
		<div class={styles.subtitle}>{hasEntries(productionInput()) ? 'Manufacturing' : 'Production'}</div>
		<div class={styles.production}>
			<ProductionGoods goods={productionInput()} />
			<Show when={hasEntries(productionInput())}><span class={styles.arrow}>into</span></Show>
			<ProductionGoods goods={productionOutput()} />
		</div>
		<div class={styles.subtitle}>Consumption</div>
		<div class={styles.consumption}>
			<ProductionGoods goods={positiveConsumption()} />
		</div>
	</>
}

export default ColonistSummary
