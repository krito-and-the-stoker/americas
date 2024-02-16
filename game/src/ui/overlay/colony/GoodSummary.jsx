import { createEffect } from 'solid-js'

import Signal from 'util/signal'
import Util from 'util/util'

import Hover from 'input/hover'

import Storage from 'entity/storage'
import Colony from 'entity/colony'

import Foreground from 'render/foreground'

import GameIcon from 'ui/components/GameIcon'

function GoodSummary() {
	const good = Signal.create(
		Hover.listen.data,
		Signal.select(data => data.good)
	)


	const consumption = Signal.create(
		Foreground.listen.screen,
		Signal.select(screen => screen.params?.colony),
		Colony.listen.colonists,
		Signal.each(
			Signal.select(colonist => colonist.consumptionSummary),
			Signal.combine([
				Storage.listen,
				Signal.chain(
					Signal.new(Hover.listen.data),
					Signal.select(data => data.good)
				)
			]),
			Signal.select(([storage, good]) => storage[good])
		),
		Signal.select(Util.sum),
	)

	createEffect(() => {
		console.log('consumption:', consumption())
	})

	const storage = Signal.create(
		Foreground.listen.screen,
		Signal.select(
			screen => screen?.params?.colony?.storage
		),
		Storage.listen
	)


	const amount = () => storage() && Math.floor(storage()[good()])

	return <Show when={good()}>
		{amount()}<GameIcon good={good()} />
	</Show>
}

export default GoodSummary