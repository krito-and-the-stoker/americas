

let currentTime = 0
let scheduled = []

const advance = deltaTime => {
	currentTime += deltaTime
	scheduled = scheduled.filter(e => e.time > currentTime || e.update(currentTime))
}

const schedule = e => scheduled.push({
	...e,
	time: currentTime
})
const remove = e => scheduled = scheduled.filter(evt => e != evt)

export default {
	advance,
	schedule,
	remove
}