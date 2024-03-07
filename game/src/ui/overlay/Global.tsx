import { createSignal, createEffect } from 'solid-js'
import { createShortcut } from "@solid-primitives/keyboard";

import style from './Global.module.scss'

import Time from 'timeline/time'

import Signal from 'util/signal-ts'
import Treasure from 'entity/treasure'
import Europe from 'view/europe'
import Foreground from 'render/foreground'

import Save from 'ui/overlay/Save'
import GameIcon from 'ui/components/GameIcon'

function findClosestIndex(arr: number[], target: number) {
  let closestIndex = 0; // Start with the first element as the closest
  let smallestDifference = Math.abs(target - arr[0]); // Calculate the initial difference

  // Loop through the array starting from the second element
  for (let i = 1; i < arr.length; i++) {
    // Calculate the absolute difference between the target value and the current array element
    let difference = Math.abs(target - arr[i]);

    // If this difference is smaller than the smallest difference found so far
    if (difference < smallestDifference) {
      // Update the smallest difference and the index of the closest element
      smallestDifference = difference;
      closestIndex = i;
    }
  }

  // Return the index of the closest element
  return closestIndex;
}

const timeScales = [.2, .4, .8, 1.6, 3.2]
function Global() {
	const [speed, setSpeed] = createSignal(findClosestIndex(timeScales, Time.get().scale) + 1)
	createEffect(() => {
		const scale = timeScales[speed() - 1]
		Time.update.scale(scale)
	})

	const paused = Signal.createSolid<boolean>(Time.listen.paused)
	const year = Signal.createSolid<number>(Time.listen.year)
	const month = Signal.createSolid<string>(Time.listen.month)
	const dayOfMonth = Signal.createSolid<string>(Time.listen.dayOfMonth)
	const screen = Signal.createSolid<any>(Foreground.listen.screen)

	const treasure = Signal.createSolid<number>(Treasure.listen.amount)

	const hasOpenScreen = () => !!screen()
	const toggleScreen = () => hasOpenScreen() ? Foreground.closeScreen() : Europe.open()

	createShortcut(['1'], () => setSpeed(1))
	createShortcut(['2'], () => setSpeed(2))
	createShortcut(['3'], () => setSpeed(3))
	createShortcut(['4'], () => setSpeed(4))
	createShortcut(['5'], () => setSpeed(5))
	createShortcut([' '], () => Time.togglePause())


	return (
		<div class={style.main}>
			<Save />
			<div>{month()} {dayOfMonth()}, A.D. {year()}</div>
			<div class={style.speed}>
				Speed:
				<span class={style.pause} onClick={() => Time.togglePause()}>{paused() ? '>' : '||'}</span>
				<span onClick={() => setSpeed(1)} class={speed() === 1 ? style.selected : undefined}>1</span>
				<span onClick={() => setSpeed(2)} class={speed() === 2 ? style.selected : undefined}>2</span>
				<span onClick={() => setSpeed(3)} class={speed() === 3 ? style.selected : undefined}>3</span>
				<span onClick={() => setSpeed(4)} class={speed() === 4 ? style.selected : undefined}>4</span>
				<span onClick={() => setSpeed(5)} class={speed() === 5 ? style.selected : undefined}>5</span>
			</div>
			<div>Treasure: {Math.round(treasure())}<GameIcon icon="gold" scale={0.8} /></div>
			<div class={style.europe} onClick={toggleScreen}>view {hasOpenScreen() ? 'Americas' : 'Europe'}</div>
		</div>
	)
}

export default Global
