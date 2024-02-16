import { createEffect } from 'solid-js'

import Signal from 'util/signal'
import Util from 'util/util'

import Hover from 'input/hover'

import Storage from 'entity/storage'
import Colony from 'entity/colony'

import Foreground from 'render/foreground'

import GameIcon from 'ui/components/GameIcon'
import ProductionGoods from 'ui/components/ProductionGoods'


function GoodSummary() {
	const good = Signal.create(
		Hover.listen.data,
		Signal.select(data => data.good)
	)


	const [consumption, consumers] = Signal.create(
		Foreground.listen.screen,
		Signal.select(screen => screen.params?.colony),
		Colony.listen.colonists,
		Signal.each(
			Signal.combine([
				Signal.through,
				Signal.chain(
					Signal.select(colonist => colonist.consumptionSummary),
					Storage.listen
				),
				Signal.chain(
					Signal.source(Hover.listen.data),
					Signal.select(data => data.good)
				),
			]),
			Signal.select(([colonist, storage, good]) => ({ colonist, goods: -storage[good] }))
		),
		[
			Signal.select(items => Util.sum(items.map(item => item.goods))),
			Signal.select(items => items.filter(item => item.goods > 0).map(item => item.colonist.unit))
		]
	)

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
		<Show when={consumption() > 0}>
			<div>Consumption</div>
			<ProductionGoods goods={{ [good()]: consumption() }} />
			<For each={consumers()}>
				{consumer => <GameIcon unit={consumer} scale={1.5} />}
			</For>
		</Show>
	</Show>
}

export default GoodSummary