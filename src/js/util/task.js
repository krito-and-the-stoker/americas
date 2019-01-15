
const BATCH_SIZE = 10

const batch = update => {
	let i = BATCH_SIZE
	let result = null
	return currentTime => {
		if (i === BATCH_SIZE) {
			i = 0
			result = update(currentTime)
		} else {
			i += 1
		}
		return result
	}
}

export default { batch }