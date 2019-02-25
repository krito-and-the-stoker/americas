const on = (target, fn) => {
	const handler = async e => {
		e.stopPropagation()
		const handleClick = async () => {	
			target.interactive = false
			await fn({ coords: e.data.global, shiftKey: e.data.originalEvent.shiftKey })
			target.interactive = true
		}

		await handleClick()
		// do not delete, this becomes relevant when there are right mouse drags
		// requestAnimationFrame(async () => {
		// 	if (Drag.isPossibleDragTarget(target)) {
		// 		setTimeout(async () => {
		// 			await handleClick()
		// 		}, Drag.MIN_DRAG_TIME)
		// 	} else {
		// 		await handleClick()
		// 	}
		// })
	}

	target.interactive = true
	target
		.on('rightdown', handler)

	const unsubscribe = () => {
		target
			.off('rightdown', handler)
	}

	return unsubscribe
}

const initialize = () => {
	window.oncontextmenu = (e) => {
		e.preventDefault()
	}
}

initialize()

export default {
	on,
}