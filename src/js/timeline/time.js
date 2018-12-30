

let currentTime = 0
let scheduled = []
let paused = false

const get = () => ({
	scheduled,
	currentTime
})

const advance = deltaTime => {
	if (!paused) {
		currentTime += deltaTime
	}
	const readyTasks = scheduled.filter(e => e.time <= currentTime)
	const needsInitialization = readyTasks.filter(e => !e.started && e.init)
	needsInitialization.forEach(e => {
		e.init()
		e.started = true
	})
	const finished = readyTasks.filter(e => !e.update(currentTime))
	finished.forEach(e => {
		if (e.finished) {
			e.finished()
		}
		e.cleanup = true
	})
	scheduled = scheduled.filter(e => !e.cleanup)
}

const schedule = (e, time = null) => scheduled.push({
	...e,
	started: false,
	cleanup: false,
	time: time || currentTime
})
const remove = e => scheduled = scheduled.filter(evt => e != evt)

const pause = () => paused = true
const resume = () => paused = false
const togglePause = () => paused = !paused

export default {
	advance,
	schedule,
	remove,
	togglePause,
	pause,
	resume,
	get
}