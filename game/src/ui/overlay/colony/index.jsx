import { createEffect, Show, Switch, Match } from 'solid-js'

import Signal from 'util/signal'
import Hover from 'input/hover'
import Foreground from 'render/foreground'

import DefaultSummary from 'ui/overlay/colony/DefaultSummary'
import ColonistSummary from 'ui/overlay/colony/ColonistSummary'

import styles from './index.module.scss'


function ColonyComponent() {
	const colony = Signal.create(
		Signal.select(
			Foreground.listen.screen,
			screen => screen?.params?.colony
		)
	)

	const name = () => colony()?.name

	const hover = Signal.create(Hover.listen.data)


	return <Show when={colony()}>
		<div class={styles.name}>{name()}</div>
		<div class={styles.hoverBox}>
			<Switch fallback={<DefaultSummary />}>
				<Match when={hover()?.type === 'colonist'}><ColonistSummary /></Match>
			</Switch>			
		</div>
	</Show>
}

export default ColonyComponent