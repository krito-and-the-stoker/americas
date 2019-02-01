import Drag from './drag'

const on = (target, fn) => {
	const handler = async e => {
		e.stopPropagation()
		const handleClick = async () => {	
			if (!Drag.isDragTarget(target)) {
				target.interactive = false
				await fn(e.data.global)
				target.interactive = true
			}
		}

		requestAnimationFrame(async () => {
			if (Drag.isPossibleDragTarget(target)) {
				setTimeout(async () => {
					await handleClick()
				}, Drag.MIN_DRAG_TIME)
			} else {
				await handleClick()
			}
		})
	}

	target.interactive = true
	target
		.on('mousedown', handler)
		.on('touchstart', handler)

	const unsubscribe = () => {
		target
			.off('mousedown', handler)
			.off('touchstart', handler)
	}

	return unsubscribe
}

export default {
	on
}