import Found from '../command/found'
import Move from '../command/move'
import MoveTo from '../command/moveTo'
import Report from '../command/report'
import Unload from '../command/unload'

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
		scheduled: scheduled.map(e => ({
			data: e.save(),
			type: e.type,
			started: e.started,
			cleanup: e.cleanup,
			willStop: e.willStop,
			time: e.time
		}))
	}
}

const getModule = type => ({
	found: Found,
	move: Move,
	moveTo: MoveTo,
	report: Report,
	unload: Unload
})[type]

const revive = (type, data) => {
	const module = getModule(type)
	if (!module) {
		console.warn('could not revive', data, type)
		return {
			cleanup : true
		}
	}

	return module.load(data)
}

const load = data => {
	paused = data.paused
	scheduled = data.scheduled.map(d => ({
		...d,
		...revive(d.type, d.data)
	}))
	currentTime = data.currentTime
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