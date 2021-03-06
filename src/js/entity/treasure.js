let treasureListeners = []
let treasure = 1000
const spend = amount => {
	if (treasure >= amount) {
		treasure -= amount
		treasureListeners.forEach(fn => fn(treasure))
		return true
	}
	return false
}

const gain = amount => {
	treasure += amount
	treasureListeners.forEach(fn => fn(treasure))
}

const bind = fn => {
	fn(treasure)
	treasureListeners.push(fn)

	return () => {
		treasureListeners = treasureListeners.filter(f => f !== fn)
	}
}

const set = amount => treasure = amount

const amount = () => treasure

const save = () => treasure
const load = data => {
	treasure = data
	treasureListeners.forEach(fn => fn(treasure))
}

export default {
	spend,
	gain,
	bind,
	amount,
	save,
	load,
	set
}