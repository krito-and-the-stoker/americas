import { Show, createSignal } from 'solid-js'
import Overlay from 'ui/overlay'
import style from './Global.module.scss'

import Time from 'timeline/time'
import Binding from 'ui/binding'
import Treasure from 'entity/treasure'
import Europe from 'view/europe'

import GameIcon from 'ui/components/GameIcon'

function Global() {
	const [speed, setSpeed] = createSignal(3)
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
			<div>{month()} {dayOfMonth()}, A.D. {year()}</div>
			<div>Treasure: {Math.round(treasure())}<GameIcon name="gold" scale={0.8} /></div>
			<div><button onClick={() => setTreasure(x => x + 10)}>more</button></div>
			<div class={style.speed}>
				<span onClick={() => Time.togglePause()}>{paused() ? '>' : '||'}</span>
				<span class={speed() === 1 ? style.selected : null}>1</span>
				<span class={speed() === 2 ? style.selected : null}>2</span>
				<span class={speed() === 3 ? style.selected : null}>3</span>
				<span class={speed() === 4 ? style.selected : null}>4</span>
				<span class={speed() === 5 ? style.selected : null}>5</span>
			</div>
		</div>
	</Show>
}

export default Global
