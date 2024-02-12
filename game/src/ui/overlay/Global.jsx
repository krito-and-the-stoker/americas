import { Show, createSignal, createEffect } from 'solid-js'
import Overlay from 'ui/overlay'
import style from './Global.module.scss'

import Time from 'timeline/time'
import Binding from 'ui/binding'
import Treasure from 'entity/treasure'
import Europe from 'view/europe'
import Foreground from 'render/foreground'

import GameIcon from 'ui/components/GameIcon'

function Global() {
	const [speed, setSpeed] = createSignal(3)
	createEffect(() => {
		const scale = [.2, .66, 1, 1.5, 3][speed() - 1]
		Time.update.scale(scale)
	})

	const [paused] = Binding.create(Time.listen.paused)
	const [year] = Binding.create(Time.listen.year)
	const [month] = Binding.create(Time.listen.month)
	const [dayOfMonth] = Binding.create(Time.listen.dayOfMonth)
	const [screen] = Binding.create(Foreground.listen.screen)

	const [treasure] = Binding.create(Treasure.listen.amount)

	const isEurope = () => screen()?.params?.name === 'europe'
	const toggleEurope = () => isEurope() ? Europe.close : Europe.open

	return <Show when={Overlay.isVisible()}>
		<div class={style.main}>
			<div>{month()} {dayOfMonth()}, A.D. {year()}</div>
			<div class={style.speed}>
				Speed:
				<span class={style.pause} onClick={() => Time.togglePause()}>{paused() ? '>' : '||'}</span>
				<span onClick={() => setSpeed(1)} class={speed() === 1 ? style.selected : null}>1</span>
				<span onClick={() => setSpeed(2)} class={speed() === 2 ? style.selected : null}>2</span>
				<span onClick={() => setSpeed(3)} class={speed() === 3 ? style.selected : null}>3</span>
				<span onClick={() => setSpeed(4)} class={speed() === 4 ? style.selected : null}>4</span>
				<span onClick={() => setSpeed(5)} class={speed() === 5 ? style.selected : null}>5</span>
			</div>
			<div>Treasure: {Math.round(treasure())}<GameIcon name="gold" scale={0.8} /></div>
			<div class={style.europe} onClick={toggleEurope()}>view {isEurope() ? 'Americas' : 'Europe'}</div>
		</div>
	</Show>
}

export default Global
