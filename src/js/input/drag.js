import Util from '../util/util'
import Foreground from '../render/foreground'

let currentDrags = []
const isDragTarget = target => currentDrags.includes(target)

let possibleDragTargets = []
const isPossibleDragTarget = target => possibleDragTargets.includes(target)

const MIN_DRAG_TIME = 150

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

let dragTargets = []
const makeDraggable = (sprite, entity) => {
	let initialCoords = null
	let initialSpriteCoords = null
	const start = coords => {
		const scale = Util.globalScale(sprite) / sprite.scale.x
		initialSpriteCoords = {
			x: sprite.x,
			y: sprite.y
		}
		initialCoords = {
			x: sprite.x - coords.x / scale,
			y: sprite.y - coords.y / scale
		}
	}

	const move = coords => {
		const scale = Util.globalScale(sprite) / sprite.scale.x
		sprite.x = initialCoords.x + coords.x / scale
		sprite.y = initialCoords.y + coords.y / scale
	}

	const end = async coords => {
		// mark all possible drag targets interactive
		const dragTargetsInteractivity = dragTargets.map(({ sprite }) => {
			const original = sprite.interactive
			sprite.interactive = true
			return {
				original,
				sprite
			}
		})

		// recursively find target by hit testing through the tree
		let targetSprite = null
		const findTarget = next => {
			if (next) {
				if (next !== sprite && dragTargets.map(({ sprite }) => sprite).includes(next)) {
					targetSprite = next
				} else {
					let originalInteractive = next.interactive
					next.interactive = false
					findTarget(Foreground.hitTest(coords))
					next.interactive = originalInteractive
				}
			}
		}
		findTarget(sprite)

		// restore their interactivity
		dragTargetsInteractivity.forEach(({ sprite, original }) => sprite.interactive = original)

		if (targetSprite) {
			const result = await dragTargets.find(target => targetSprite === target.sprite).fn(entity, sprite.getGlobalPosition())
			sprite.interactive = true
			if (result) {
				return
			}
		}
		sprite.interactive = true
		sprite.x = initialSpriteCoords.x
		sprite.y = initialSpriteCoords.y
	}

	return on(sprite, start, move, end, false)
}

const makeDragTarget = (sprite, fn) => {
	const target = {
		sprite,
		fn
	}
	dragTargets.push(target)

	return () => dragTargets = dragTargets.filter(t => t !== target)
}

export default {
	on,
	isDragTarget,
	isPossibleDragTarget,
	makeDraggable,
	makeDragTarget,
	MIN_DRAG_TIME
}