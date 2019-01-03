
const TIME_SCALE = 1

let currentTime = 0
let scheduled = []
let paused = false

const get = () => ({
	scheduled,
	currentTime
})

const advance = deltaTime => {
	if (!paused) {
		currentTime += deltaTime * TIME_SCALE
	}
	const readyTasks = scheduled.filter(e => e.time <= currentTime)
	const needsInitialization = readyTasks.filter(e => !e.started && e.init)
	needsInitialization.forEach(e => {
		e.cleanup = !e.init()
		e.started = true
	})
	const finished = readyTasks.filter(e => !e.update(currentTime))
	finished.forEach(e => {
		if (e.finished) {
			e.finished()
		}
		e.cleanup = true
	})
	const stop = scheduled.filter(e => e.stop)
	stop.forEach(e => {
		if (e.stopped) {
			e.stopped()
		}
		e.cleanup = true
	})
	scheduled = scheduled.filter(e => !e.cleanup)
}

const schedule = (e, time = null) => {
	scheduled.push({
		...e,
		started: false,
		cleanup: false,
		stop: false,
		time: time || currentTime
	})
	return () => { e.stop = true }
}

const pause = () => paused = true
const resume = () => paused = false
const togglePause = () => paused = !paused

const save = () => {
	return {
		currentTime,
		paused
	}
}

export default {
	advance,
	schedule,
	togglePause,
	pause,
	resume,
	get
}