import Binding from 'util/binding'
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
const YEAR = 40000
const CARGO_LOAD_TIME = 400
const LOW_PRIORITY_FACTOR = 30

let currentTime = 0
let scheduled = []

const startYear = 1492
const time = {
	scale: 1,
	year: startYear,
	paused: false
}

const get = () => ({
	scheduled,
	currentTime,
	year: time.year
})

const speedUp = () => update.scale(time.scale * 1.5)
const slowDown = () => update.scale(time.scale / 1.5)
const normalize = () => update.scale(1)

const pause = () => update.paused(true)
const resume = () => update.paused(false)
const togglePause = () => update.paused(!time.paused)


let step = 0
const advance = deltaTime => {
	if (time.paused) {
		return
	}
	currentTime += deltaTime * time.scale
	// TODO: move this away from here
	try {
		step += 1
		if (step === LOW_PRIORITY_FACTOR) {
			step = 0
			update.year(Math.round(startYear + currentTime / YEAR))
		}

		const tasks = scheduled
			.filter(e => !step || e.priority)
			.filter(e => {
				if (!e.started && e.init) {
					e.alive = e.init(currentTime)
					e.started = true
				} else {
					e.alive = true
				}
				return e.started || !e.init
			})
			
		tasks
			.filter(e => !e.alive || !e.update || !e.update(currentTime))
			.forEach(e => {
				if (e.finished) {
					e.finished()
				}
				e.cleanup = true
			})

		scheduled
			.filter(e => e.willStop)
			.forEach(e => {
				if (e.stopped) {
					e.stopped()
				}
				e.cleanup = true
			})

		scheduled = scheduled.filter(e => !e.cleanup)
	}	catch(error) {
		MainLoop.stop()
		throw error
	}
}

const listen = {
	year: fn => Binding.listen(time, 'year', fn),
	scale: fn => Binding.listen(time, 'scale', fn),
	paused: fn => Binding.listen(time, 'paused', fn),
}

const update = {
	year: value => Binding.update(time, 'year', value),
	scale: value => Binding.update(time, 'scale', value),
	paused: value => Binding.update(time, 'paused', value),
}

const schedule = e => {
	const task = {
		...e,
		started: false,
		cleanup: false,
		willStop: false,
	}
	scheduled.push(task)

	const stop = () => {
		task.willStop = true
	}

	return stop
}

const save = () => {
	return {
		currentTime,
		scale: time.scale
	}
}


const load = data => {
	currentTime = data.currentTime
	update.scale(data.scale || 1)
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
	TEACH_BASE_TIME,
	CARGO_LOAD_TIME
}