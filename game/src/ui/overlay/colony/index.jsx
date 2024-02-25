import { createEffect, createSignal, Show, Switch, Match } from 'solid-js'

import Layout from 'entity/layout'
import Colony from 'entity/colony'

import Signal from 'util/signal'
import Hover from 'input/hover'
import Foreground from 'render/foreground'

import DefaultSummary from 'ui/overlay/colony/DefaultSummary'
import ColonistSummary from 'ui/overlay/colony/ColonistSummary'
import UnitSummary from 'ui/overlay/colony/UnitSummary'
import GoodSummary from 'ui/overlay/colony/GoodSummary'

import styles from './index.module.scss'

const wait = input => new Promise(resolve => setTimeout(() => resolve(input), 1000))
const race = input => new Promise(resolve => setTimeout(() => resolve(input), 1000 * Math.random()))

function ColonyComponent() {
	const colony = Signal.create(
		Foreground.listen.screen,
		Signal.select(screen => screen?.params?.colony),
	)

	const name = () => colony()?.name

	const hover = Signal.create(Hover.listen.data)
	const [isInside, setIsInside] = createSignal(false)

	const reflow = colony => {
		console.log(colony.newBuildings)
		colony.layout = Layout.create()
		colony.waterMap = Layout.placeWater(colony)
		const buildings = colony.newBuildings
		colony.newBuildings = []
		for (const building of buildings) {
			building.placement = building.placement.map(() => Layout.placeBuilding(colony, building))
			colony.newBuildings.push(building)
		}

		Colony.update.newBuildings(colony)
	}


	return <Show when={colony()}>
		<div class={styles.debug}>
			<a onClick={() => reflow(colony())}>Reflow buildings</a>
		</div>
		<div class={styles.name}>{name()}</div>
		<div
			classList={{ [styles.hoverBox]: true, [styles.hidden]: isInside()}}
			onMouseEnter={() => { setIsInside(true) }}
			onMouseLeave={() => { setIsInside(false) }}
		>
			<Switch fallback={<DefaultSummary />}>
				<Match when={hover()?.type === 'colonist'}><ColonistSummary /></Match>
				<Match when={hover()?.type === 'unit'}><UnitSummary /></Match>
				<Match when={hover()?.type === 'good'}><GoodSummary /></Match>
			</Switch>			
		</div>
	</Show>
}

export default ColonyComponent