import { createSignal, onCleanup } from 'solid-js'
import Util from 'util/util'


function create(listen, update) {
	const [signal, setSignal] = createSignal(undefined, { equals: false })
	const cleanup = listen(value => {
		setSignal(value)
	})

	onCleanup(cleanup)

	const setValue = arg => {
		if (Util.isFunction(arg)) {
			update(arg(signal()))
		} else {
			update(arg)
		}
	}

	return [signal, setValue]
}

export default {
	create
}
