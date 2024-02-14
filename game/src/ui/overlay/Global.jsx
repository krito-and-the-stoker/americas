import { createSignal, createEffect } from 'solid-js'
import { useKeyDownEvent } from "@solid-primitives/keyboard";

import style from './Global.module.scss'

import Signal from 'util/xsignal'
import Time from 'timeline/time'
import Treasure from 'entity/treasure'
import Europe from 'view/europe'
import Foreground from 'render/foreground'

import GameIcon from 'ui/components/GameIcon'

function findClosestIndex(arr, target) {
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

	const paused = Signal.create(Time.listen.paused)
	const year = Signal.create(Time.listen.year)
	const month = Signal.create(Time.listen.month)
	const dayOfMonth = Signal.create(Time.listen.dayOfMonth)
	const screen = Signal.create(Foreground.listen.screen)

	const treasure = Signal.create(Treasure.listen.amount)

	const isEurope = () => screen()?.params?.name === 'europe'
	const toggleEurope = () => isEurope() ? Europe.close() : Europe.open()

	const keyboardMap = {
		'1': () => {
			setSpeed(1)
		},
		'2': () => {
			setSpeed(2)
		},
		'3': () => {
			setSpeed(3)
		},
		'4': () => {
			setSpeed(4)
		},
		'5': () => {
			setSpeed(5)
		},
		' ': () => {
		  Time.togglePause()
		}
	}
	const keyDownEvent = useKeyDownEvent();
	createEffect(() => {
	  const e = keyDownEvent();

	  if (e) {
	  	const keyHandler = keyboardMap[e.key]
	  	if (keyboardMap[e.key]) {
	  		keyHandler()
		    e.preventDefault();
	  	}
	  }
	});


	return (
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
			<div class={style.europe} onClick={toggleEurope}>view {isEurope() ? 'Americas' : 'Europe'}</div>
		</div>
	)
}

export default Global
