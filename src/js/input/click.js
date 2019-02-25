import Input from 'input'

const on = (target, fn) => {
	const handleDown = () => {
		Input.makeHot(target)
	}

	const handleUp = async e => {
		if (Input.isHot(target)) {
			e.stopPropagation()
			Input.clear()			

			target.interactive = false
			await fn(e.data.global)
			target.interactive = true
		}

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
		.on('mousedown', handleDown)
		.on('touchstart', handleDown)
		.on('mouseup', handleUp)
		.on('touchnend', handleUp)

	const unsubscribe = () => {
		target
			.off('mousedown', handleDown)
			.off('touchstart', handleDown)
			.off('mouseup', handleUp)
			.off('touchnend', handleUp)
	}

	return unsubscribe
}

export default {
	on
}