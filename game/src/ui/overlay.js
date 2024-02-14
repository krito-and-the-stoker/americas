import { createSignal } from 'solid-js'

const [visible, setVisible] = createSignal(false)
const isVisible = () => {
	return visible()
}

const initialize = () => {
	setVisible(true)
}

export default {
	initialize,
	isVisible
}