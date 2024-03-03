import { createSignal, createEffect } from 'solid-js'
import { useKeyDownEvent } from "@solid-primitives/keyboard";

import style from './Global.module.scss'

import Signal from 'util/signal'
import SaveGame from 'util/savegame'
import TimeView from 'util/timeView'
import Time from 'timeline/time'
import Treasure from 'entity/treasure'
import Europe from 'view/europe'
import Foreground from 'render/foreground'

import GameIcon from 'ui/components/GameIcon'
import { init } from 'snabbdom';

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
	const hasOpenScreen = () => !!screen()
	const toggleScreen = () => hasOpenScreen() ? Foreground.closeScreen() : Europe.open()

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

	const gameName = Signal.create(SaveGame.derived.name.listen)
	const [isSaving, setIsSaving] = createSignal(false)
	const saveGame = async event => {
		event.preventDefault()

		if (isSaving()) {
			return
		}

		setIsSaving(true)
		await SaveGame.asyncSave()
		setIsSaving(false)
	}

	const SIXTY_SECONDS = 60 * 1000
	const intervalValues = {
		NEVER: 0,
		SIXTY_SECONDS,
		FIVE_MINUTES: 5 * SIXTY_SECONDS,
		TEN_MINUTES: 10 * SIXTY_SECONDS,
		THIRTY_MINUTES: 30 * SIXTY_SECONDS,
		DEFAULT: 5 * SIXTY_SECONDS
	}
	let initialInterval = 'DEFAULT'
	for(const [key, value] of Object.entries(intervalValues)) {
		if (value === SaveGame.state.autosaveInterval) {
			initialInterval = key
			break
		}
	}
	const [interval, setInterval] = createSignal(initialInterval)
	const updateInterval = event => {
		setInterval(event.target.value)
		const value = intervalValues[event.target.value] ?? intervalValues.DEFAULT
		SaveGame.update.autosaveInterval(value)
	}

	const nowTime = Signal.basic(Date.now())
	const lastSaveTime = Signal.create(
		Signal.combine({
			lastTime: Signal.source(SaveGame.listen.lastSaveTime),
			nowTime: Signal.source(nowTime.listen),
		}),
		Signal.select(({ lastTime, nowTime }) => lastTime > 0 ? nowTime - lastTime : null),
		Signal.select(
			timeDiff => timeDiff && TimeView.describe(timeDiff, () => { nowTime.update(Date.now()) })
		)
	)

	const saveOnExit = Signal.create(SaveGame.listen.saveOnExit)
	const updateSaveOnExit = event => {
		SaveGame.update.saveOnExit(event.target.checked)
	}


	return (
		<div class={style.main}>
			<div class={style.save}>
				<div>
					<span>Game {gameName()} - </span>
					<a onClick={SaveGame.duplicate} class={style.link}>Duplicate</a>
				</div>
				<div>
					<span>Autosave Interval:</span>
					<select value={interval()} onChange={updateInterval} class={style.interval}>
						<option value="NEVER">Never</option>
						<option value="SIXTY_SECONDS">60 seconds</option>
						<option value="FIVE_MINUTES">5 minutes</option>
						<option value="TEN_MINUTES">10 minutes</option>
						<option value="THIRTY_MINUTES">30 minutes</option>
					</select>
				</div>
				<div>
					<div>
						<span>Save on exit:</span>
						<input type="checkbox" checked={saveOnExit()} onChange={updateSaveOnExit} />
					</div>
				</div>
				<div>
					<a onClick={saveGame} classList={{[style.link]: true, disabled: isSaving() }}>Save</a>
					<Show when={lastSaveTime()}>
						<span> - Saved {lastSaveTime()}</span>
					</Show>
				</div>
			</div>
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
			<div>Treasure: {Math.round(treasure())}<GameIcon icon="gold" scale={0.8} /></div>
			<div class={style.europe} onClick={toggleScreen}>view {hasOpenScreen() ? 'Americas' : 'Europe'}</div>
		</div>
	)
}

export default Global
