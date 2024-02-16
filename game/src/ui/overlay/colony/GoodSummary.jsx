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
		Signal.niceSelect(data => data.good)
	)

	const colonists = Signal.create(
		Foreground.listen.screen,
		Signal.niceSelect(screen => screen.params?.colony),
		Colony.listen.colonists,
		Signal.niceSelect(colonists => colonists.map(colonist => colonist.consumptionSummary)),
		Signal.each(
			Signal.chain(
				Storage.listen,
				Signal.niceSelect(storage => storage.cotton)
			),
			Util.sum
		),
		Signal.effect(x => console.log('summaries', x))
	)

	createEffect(() => {
		console.log('colonists:', colonists())
	})
	// const colonists = Signal.create(
	// 	Foreground.listen.screen,
	// 	Signal.niceSelect(screen => screen.params?.colony),
	// 	Colony.listen.colonists
	// )

	// createEffect(() => {
	// 	console.log('colonists', colonists())
	// })


	const storage = Signal.create(
		Signal.chain(
			Signal.select(
				Foreground.listen.screen,
				screen => screen?.params?.colony?.storage
			),
			Storage.listen
		)
	)



	// const [[colony], storage] = Signal.create([
	// 	Signal.chain(
	// 		Signal.select(
	// 			Foreground.listen.screen,
	// 			screen => screen?.params?.colony
	// 		),
	// 		[
	// 			Signal.through,
	// 			Signal.chain(
	// 				Colony.listen.colonists,
	// 				Signal.select(colonists => colonists.map(colonist => colonist.productionSummary)),
	// 				Signal.each(Storage.listen)
	// 				Signal.reduce(
	// 					(sum, summary) => sum + summary['food'], 0
	// 				)
	// 			)
	// 		]
	// 	),
	// 	Signal.chain(
	// 		Signal.select(
	// 			Foreground.listen.screen,
	// 			screen => screen?.params?.colony?.storage
	// 		),
	// 		Storage.listen
	// 	)
	// ])

	const amount = () => storage() && Math.floor(storage()[good()])

	return <Show when={good()}>
		{amount()}<GameIcon good={good()} />
	</Show>
}

export default GoodSummary