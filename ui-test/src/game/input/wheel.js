import NormalizeWheel from 'normalize-wheel'

const on = fn => {
	window.addEventListener('wheel', e => {
		const normalized = NormalizeWheel(e)

		const delta = {
			x: normalized.pixelX,
			y: normalized.pixelY
		}

		const position = {
			x: e.clientX,
			y: e.clientY
		}

		fn({ delta, position })
	})
}

export default {
	on
}