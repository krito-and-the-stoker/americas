const on = (target, onStart, onMove, onEnd, rollout = false) => {
	let currentStartCoords = null
	let currentSpeed = null
	let lastCoords = null
	let rollingOut = false
	const cancelDrag = () => {
		possibleDragTargets = possibleDragTargets.filter(t => t !== target)
		currentDrags = currentDrags.filter(t => t !== target)
	}

	const dragStart = e => {
		if (possibleDragTargets.length > 0) {
			return
		}
		possibleDragTargets.push(target)
		target.on('removed', cancelDrag)

		lastCoords = {
			x: e.data.global.x,
			y: e.data.global.y
		}
		currentSpeed = {
			x: 0,
			y: 0
		}
		rollingOut = false

		setTimeout(() => {
			if (!possibleDragTargets.includes(target)) {
				return
			}

			currentDrags.push(target)
			currentStartCoords = {
				x: lastCoords.x,
				y: lastCoords.y
			}

			if (rollout) {			
				const handleSpeedDeterioration = () => {
					if (!moveHandled) {
						currentSpeed = {
							x: 0.7*currentSpeed.x,
							y: 0.7*currentSpeed.y
						}
					}
					if (currentStartCoords) {
						requestAnimationFrame(handleSpeedDeterioration)
					}
				}
				requestAnimationFrame(handleSpeedDeterioration)
			}

			onStart(currentStartCoords)
		}, MIN_DRAG_TIME)
	}

	let moveHandled = false
	const dragMove = e => {
		if (!currentStartCoords) {
			return
		}
		e.stopPropagation()

		const newCoords = {
			x: e.data.global.x,
			y: e.data.global.y
		}
		currentSpeed = {
			x: 0.3*currentSpeed.x + 0.9*(newCoords.x - lastCoords.x),
			y: 0.3*currentSpeed.y + 0.9*(newCoords.y - lastCoords.y)
		}
		lastCoords = { ...newCoords }
		
		onMove(newCoords)

		moveHandled = true
		requestAnimationFrame(() => moveHandled = false)
	}

	const dragEnd = async e => {
		if (possibleDragTargets.includes(target)) {
			possibleDragTargets = possibleDragTargets.filter(t => t !== target)
		}

		currentDrags = currentDrags.filter(t => t !== target)

		// otherwise sometimes drag end fires twice
		if (!currentStartCoords) {
			return
		}
		e.stopPropagation()

		currentStartCoords = null
		if (rollout) {		
			rollingOut = true
			const rollOut = async () => {
				if(rollingOut && currentSpeed.x*currentSpeed.x + currentSpeed.y*currentSpeed.y > 2) {
					const newCoords = {
						x: currentSpeed.x + lastCoords.x,
						y: currentSpeed.y + lastCoords.y
					}
					currentSpeed.x *= .9
					currentSpeed.y *= .9
					lastCoords = { ...newCoords }

					onMove(newCoords)
					requestAnimationFrame(rollOut)
				} else {
					target.off('removed', cancelDrag)
					await onEnd(lastCoords)
				}
			}
			rollOut()
		} else {
			target.off('removed', cancelDrag)
			await onEnd(lastCoords)
		}
	}

	target.interactive = true
	target
		.on('mousedown', dragStart)
		.on('touchstart', dragStart)
		.on('mousemove', dragMove)
		.on('touchmove', dragMove)
		.on('mouseup', dragEnd)
		.on('mouseupoutside', dragEnd)
		.on('touchend', dragEnd)
		.on('touchendoutside', dragEnd)

	const unsubscribe = () => {
		target
			.off('mousedown', dragStart)
			.off('touchstart', dragStart)
			.off('mousemove', dragMove)
			.off('touchmove', dragMove)
			.off('mouseup', dragEnd)
			.off('mouseupoutside', dragEnd)
			.off('touchend', dragEnd)
			.off('touchendoutside', dragEnd)
	}

	return unsubscribe
}