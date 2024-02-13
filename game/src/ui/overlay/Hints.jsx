import { createEffect, For, Show } from 'solid-js'

import Hints from 'input/hints'
import Foreground from 'render/foreground'

import Binding from 'ui/binding'

import style from './Hints.module.scss'


function HintsComponent() {
	const [hints]	= Binding.create(Hints.listen)
	const [screen] = Binding.create(Foreground.listen.screen)
	const isEurope = () => screen()?.params?.name === 'europe'

	const hasHints = () => hints()?.length > 0
	const format = action => action[0].toUpperCase() + action.slice(1)

	return <Show when={hasHints() && !isEurope()}>
		<div class={style.main}>
			<For each={hints()}>
				{hint => <div>{format(hint.action)}: {hint.text}</div>}
			</For>
		</div>
	</Show>
}

export default HintsComponent
