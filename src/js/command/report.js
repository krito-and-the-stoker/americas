const INTERVAL = 1000

let lastPrint = 0
let counter = 0

const update = currentTime => {
	if (currentTime > lastPrint + INTERVAL) {
		console.log('ticker tickt')
		lastPrint = currentTime
		counter += 1
	}
	return counter < 20
}

const create = () => ({
	update
})

export default {
	create
}