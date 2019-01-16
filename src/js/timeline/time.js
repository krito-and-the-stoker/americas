import Binding from '../util/binding'
import MainLoop from 'mainloop.js'

const MOVE_BASE_TIME = 8000
const UNLOAD_TIME = 3000
const LOAD_TIME = 3000
const EUROPE_SAIL_TIME = 15000
const PRODUCTION_BASE_TIME = 30000
const TEACH_BASE_TIME = 300000
const CUT_FOREST = 80000
const PLOW = 80000
const CONSTRUCT_ROAD = 80000
const YEAR = 80000

let currentTime = 0
let scheduled = []
let paused = false

const startYear = 1492
const time = {
	scale: 1,
	year: startYear
}

const get = () => ({
	scheduled,
	currentTime
})

const speedUp = () => time.scale *= 1.5
const slowDown = () => time.scale /= 1.5
const normalize = () => time.scale = 1


const advance = deltaTime => {
	if (!paused) {
		currentTime += deltaTime * time.scale
	}
	// TODO: move this away from here
	try {
		update.year(Math.round(startYear + currentTime / YEAR))
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
	catch(error) {
		MainLoop.stop()
		throw error
	}
}

const listen = {
	year: fn => Binding.listen(time, 'year', fn)
}

const update= {
	year: value => Binding.update(time, 'year', value)
}

const schedule = (e, time = null) => {
	const task = {
		...e,
		started: false,
		cleanup: false,
		willStop: false,
		time: time || currentTime
	}
	scheduled.push(task)

	const stop = () => {
		task.willStop = true
	}

	return stop
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
	listen,
	schedule,
	togglePause,
	save,
	load,
	pause,
	resume,
	get,
	speedUp,
	slowDown,
	normalize,
	MOVE_BASE_TIME,
	UNLOAD_TIME,
	LOAD_TIME,
	EUROPE_SAIL_TIME,
	PRODUCTION_BASE_TIME,
	CUT_FOREST,
	PLOW,
	CONSTRUCT_ROAD,
	TEACH_BASE_TIME
}