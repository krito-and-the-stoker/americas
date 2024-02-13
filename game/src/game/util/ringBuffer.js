const create = (size) => {
	// we allow to create a zero sized ringbuffer,
	// which is effectively turning off the buffer
	if (size < 1) {
		let next = 0
		return {
			push: () => {
				next += 1
			},
			read: () => [],
			get length() {
				return 0
			},
			get virtualLength() {
				return next
			}
		}
	}

	const elements = []
	let next = 0 // when the array is full it points to the oldest entry
	// which is also the next that is being written

	return {
		// push element into ringbuffer
		push: (element) => {
			if (elements.length < size) {
				elements.push(element)
			} else {
				// array is full, overwrite old entries
				elements[next % size] = element
				next += 1
			}
		},

		// read all elements from ringbuffer
		// the order is unchanged with respect to the push operation
		read: () => {
			if (elements.length < size) {
				// return unchanged copy
				return elements.map(x => x)
			} else {
				// swap order around "next" to preserve pushed order
				// example:
				// next = 2 (so it points to "c")
				// [a, b, c, d, e] => [c, d, e, a, b]
				return elements.slice(next % size).concat(elements.slice(0, next % size))
			}
		},

		get length() {
			return elements.length
		},

		get virtualLength() {
			return next
		}
	}
}

export default create
