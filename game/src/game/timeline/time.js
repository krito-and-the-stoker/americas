import Binding from 'util/binding'

const DAY = 750
const WEEK = 7 * DAY
const MONTH = 30 * DAY
const YEAR = 365 * DAY

const MOVE_BASE_TIME = 2 * WEEK
const UNLOAD_TIME = 3 * DAY
const LOAD_TIME = 3 * DAY
const EUROPE_SAIL_TIME = 3 * MONTH
const PRODUCTION_BASE_TIME = MONTH
const TEACH_BASE_TIME = 4 * YEAR
const PROMOTION_BASE_TIME = 5 * YEAR
const DEMOTION_BASE_TIME = 3 * MONTH
const CUT_FOREST = 4 * MONTH
const PLOW = 4 * MONTH
const CONSTRUCT_ROAD = 4 * MONTH
const CARGO_BASE_LOAD_TIME = WEEK
const CARGO_BASE_TRADE_TIME = 2 * DAY
const POWER_TRANSFER_BASE_TIME = 30 * YEAR

const LOW_PRIORITY_DELTA_TIME = 750

let currentTime = 0
let scheduled = []
let prioritized = []

const months = [
  'January',
  'February',
  'March',
  'April',
  'Mai',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
]

const daysInMonth = {
  January: 31,
  February: 28,
  March: 31,
  April: 30,
  Mai: 31,
  June: 30,
  July: 31,
  August: 31,
  September: 30,
  October: 31,
  November: 30,
  December: 31
}

const startYear = 1607
const time = {
  scale: 1,
  year: startYear,
  timeOfYear: 0,
  paused: 0,
  monthNumber: 0,
  month: months[0],
  dayOfMonth: 0,
}

const get = () => ({
  scale: time.scale,
  scheduled,
  currentTime,
  year: time.year,
  timeOfYear: time.timeOfYear,
})

const now = () => currentTime

const speedUp = () => update.scale(time.scale * 1.5)
const slowDown = () => update.scale(time.scale / 1.5)
const normalize = () => update.scale(1)

const pause = () => update.paused(time.paused + 1)
const resume = () => update.paused(Math.max(time.paused - 1, 0))
const togglePause = () => update.paused(time.paused ? 0 : 1)

const yearAndMonth = someTime => {
  const timeOfYear = (someTime % YEAR) / YEAR
  const month = months[Math.floor(12 * timeOfYear)]
  return {
    month,
    year: Math.floor(startYear + someTime / YEAR),
  }
}

let lowPrioDeltaTime = 0
const advance = deltaTime => {
  if (time.paused) {
    Binding.applyAllUpdates()
    return
  }
  currentTime += deltaTime * time.scale

  lowPrioDeltaTime += deltaTime * time.scale
  const highPrioDeltaTime = deltaTime * time.scale

  const tasks = (lowPrioDeltaTime >= LOW_PRIORITY_DELTA_TIME ? scheduled : prioritized).filter(
    e => {
      if (!e.started && e.init) {
        e.alive = e.init(currentTime)
        e.started = true
      } else {
        e.alive = true
      }
      return e.started || !e.init
    }
  )

  tasks
    .filter(
      e =>
        !e.alive ||
        !e.update ||
        !e.update(currentTime, e.priority ? highPrioDeltaTime : lowPrioDeltaTime)
    )
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
  const dayOfMonth = Math.ceil(((12 * time.timeOfYear) % 1) * daysInMonth[time.month])
  if (dayOfMonth !== time.dayOfMonth) {
    update.dayOfMonth(dayOfMonth)
  }

  Binding.applyAllUpdates()
}

let lastCurve = 0
let currentStrength = 0.5 + 1.5 * Math.random()
const season = () => {
  const phase =
    time.timeOfYear +
    0.25 - // start sine curve at winter
    0.08333 // make a 1 month offset t compensate

  const curve = Math.sin(2 * Math.PI * phase)
  const sign = Math.sign(curve)
  const strength = Math.abs(curve)

  if ((lastCurve < 0 && curve > 0) || (lastCurve > 0 && curve < 0)) {
    currentStrength = window.season || 0.5 + 1.5 * Math.random()
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
  dayOfMonth: fn => Binding.listen(time, 'dayOfMonth', fn),
}

const update = {
  year: value => Binding.update(time, 'year', value),
  timeOfYear: value => Binding.update(time, 'timeOfYear', value),
  scale: value => Binding.update(time, 'scale', value),
  paused: value => Binding.update(time, 'paused', value),
  month: value => Binding.update(time, 'month', value),
  dayOfMonth: value => Binding.update(time, 'dayOfMonth', value),
}

const schedule = e => {
  const task = {
    ...e,
    started: false,
    cleanup: false,
    willStop: false,
    sort: e.sort || 10,
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

  if (e.scheduled) {
    e.scheduled()
  }

  return stop
}

const save = () => {
  return {
    currentTime,
    scale: time.scale,
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
  update,
  schedule,
  togglePause,
  yearAndMonth,
  save,
  load,
  pause,
  resume,
  get,
  now,
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
  YEAR,
  CONSTRUCT_ROAD,
  TEACH_BASE_TIME,
  CARGO_BASE_LOAD_TIME,
  CARGO_BASE_TRADE_TIME,
  PROMOTION_BASE_TIME,
  DEMOTION_BASE_TIME,
  POWER_TRANSFER_BASE_TIME,
  DAY,
  WEEK,
  MONTH,
}
