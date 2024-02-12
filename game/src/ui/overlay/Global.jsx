import { Show } from 'solid-js'
import Overlay from 'ui/overlay'
import style from './Global.module.scss'

import Time from 'timeline/time'
import Binding from 'ui/binding'
import Treasure from 'entity/treasure'

import GameIcon from 'ui/components/GameIcon'

function Global() {
	const [treasure, setTreasure] = Binding.create(
		Treasure.listen.amount,
		Treasure.update.amount
	)

	const [scale] = Binding.create(Time.listen.scale)
	const [paused] = Binding.create(Time.listen.paused)
	const [year] = Binding.create(Time.listen.year)
	const [month] = Binding.create(Time.listen.month)
	const [dayOfMonth] = Binding.create(Time.listen.dayOfMonth)

	return <Show when={Overlay.isVisible()}>
		<div class={style.main}>
			<br /><span>{month()} {dayOfMonth()}, A.D. {year()}</span>
			Treasure: {Math.round(treasure())}<GameIcon name="gold" scale={0.8} />
			<br /><button onClick={() => setTreasure(x => x + 10)}>more</button>
		</div>
	</Show>
}

export default Global
