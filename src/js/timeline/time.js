import Binding from 'util/binding'

const BASE_FACTOR = 1.5
const MOVE_BASE_TIME = 8000 * BASE_FACTOR
const UNLOAD_TIME = 3000 * BASE_FACTOR
const LOAD_TIME = 3000 * BASE_FACTOR
const EUROPE_SAIL_TIME = 20000 * BASE_FACTOR
const PRODUCTION_BASE_TIME = 30000 * BASE_FACTOR
const TEACH_BASE_TIME = 300000 * BASE_FACTOR
const CUT_FOREST = 80000 * BASE_FACTOR
const PLOW = 80000 * BASE_FACTOR
const CONSTRUCT_ROAD = 80000 * BASE_FACTOR
const YEAR = 60000 * BASE_FACTOR
const CARGO_LOAD_TIME = 400 * BASE_FACTOR
const LOW_PRIORITY_DELTA_TIME = 500

let currentTime = 0
let scheduled = []
let prioritized = []

const months = ['January', 'February', 'March', 'April', 'Mai', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

const startYear = 1607
const time = {
	scale: 1,
	year: startYear,
	timeOfYear: 0,
	paused: 0,
	monthNumber: 0,
	month: months[0]
}

const get = () => ({
	scheduled,
	currentTime,
	year: time.year,
	timeOfYear: time.timeOfYear
})

const speedUp = () => update.scale(time.scale * 1.5)
const slowDown = () => update.scale(time.scale / 1.5)
const normalize = () => update.scale(1)

const pause = () => update.paused(time.paused + 1)
const resume = () => update.paused(Math.max(time.paused - 1, 0))
const togglePause = () => update.paused(time.paused ? 0 : 1)


let lowPrioDeltaTime = 0
const advance = deltaTime => {
	if (time.paused) {
		Binding.applyAllUpdates()
		return
	}
	currentTime += deltaTime * time.scale
	// TODO: move this away from here
	try {
		lowPrioDeltaTime += deltaTime * time.scale

		const tasks = (lowPrioDeltaTime >= LOW_PRIORITY_DELTA_TIME ? scheduled : prioritized)
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
			.filter(e => !e.alive || !e.update || !e.update(currentTime, e.priority ? deltaTime : lowPrioDeltaTime))
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
		prioritized = prioritized.filter(e => !e.cleanup)

		if (lowPrioDeltaTime >= LOW_PRIORITY_DELTA_TIME) {
			lowPrioDeltaTime = 0
		}

		update.timeOfYear((currentTime % YEAR) / YEAR)
		update.year(Math.floor(startYear + currentTime / YEAR))
		if (Math.floor(12 * time.timeOfYear) !== time.monthNumber) {
			time.monthNumber = Math.floor(12 * time.timeOfYear)
			update.month(months[time.monthNumber])
		}

		Binding.applyAllUpdates()
	}	catch(error) {
		throw error
	}
}

let lastCurve = 0
let currentStrength = 0.5 + 1.5*Math.random()
const season = () => {
	const phase = time.timeOfYear
		+ 0.25 // start sine curve at winter
		- 0.08333 // make a 1 month offset t compensate

	const curve = Math.sin(2*Math.PI * phase)
	const sign = Math.sign(curve)
	const strength = Math.abs(curve)

	if ((lastCurve < 0 && curve > 0) || (lastCurve > 0 && curve < 0)) {
		currentStrength = window.season || 0.5 + 1.5*Math.random()
	}
	lastCurve = curve
	
	return -sign * currentStrength * strength * strength
}


const listen = {
	year: fn => Binding.listen(time, 'year', fn),
	timeOfYear: fn => Binding.listen(time, 'timeOfYear', fn),
	scale: fn => Binding.listen(time, 'scale', fn),
	paused: fn => Binding.listen(time, 'paused', fn),
	month: fn => Binding.listen(time, 'month', fn),
}

const update = {
	year: value => Binding.update(time, 'year', value),
	timeOfYear: value => Binding.update(time, 'timeOfYear', value),
	scale: value => Binding.update(time, 'scale', value),
	paused: value => Binding.update(time, 'paused', value),
	month: value => Binding.update(time, 'month', value),
}

const schedule = e => {
	const task = {
		...e,
		started: false,
		cleanup: false,
		willStop: false,
		sort: e.sort || 10
	}

	scheduled.push(task)
	if (task.priority) {
		prioritized.push(task)
	}

	scheduled = scheduled.sort((a, b) => a.sort - b.sort)
	prioritized = prioritized.sort((a, b) => a.sort - b.sort)

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
	prioritized = []
}

export default {
	advance,
	season,
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