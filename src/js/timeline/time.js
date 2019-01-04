
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
	const finishedAfterInit = needsInitialization.filter(e => {
		e.started = true
		return !e.init(currentTime)
	})
	
	const finished = readyTasks
		.filter(e => !finishedAfterInit.includes(e))
		.filter(e => !e.update || !e.update(currentTime))

	Array().concat(finished).concat(finishedAfterInit).forEach(e => {
		if (e.finished) {
			e.finished()
		}
		e.cleanup = true
	})
	const willStop = scheduled.filter(e => e.willStop)
	willStop.forEach(e => {
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
		willStop: false,
		time: time || currentTime
	})
	return () => { e.willStop = true }
}

const pause = () => paused = true
const resume = () => paused = false
const togglePause = () => paused = !paused

const save = () => {
	return {
		currentTime,
		paused,
	}
}


const load = data => {
	paused = data.paused
	currentTime = data.currentTime
	scheduled = []
}

export default {
	advance,
	schedule,
	togglePause,
	save,
	load,
	pause,
	resume,
	get
}