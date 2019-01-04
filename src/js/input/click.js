import Drag from './drag'

const on = (target, fn) => {
	const handler = e => {
		e.stopPropagation()
		const handleClick = () => {			
			if (!Drag.isDragTarget(target)) {
				fn(e.data.global)
			}
		}

		requestAnimationFrame(() => {
			if (Drag.isPossibleDragTarget(target)) {
				setTimeout(handleClick, Drag.MIN_DRAG_TIME)				
			} else {
				handleClick()
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