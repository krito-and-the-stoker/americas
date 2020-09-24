import * as PIXI from 'pixi.js'

import Util from 'util/util'
import Binding from 'util/binding'

import Input from 'input'
import Hints from 'input/hints'

import Foreground from 'render/foreground'


const DRAG_DISTANCE = 3

let draggables = []
const isDraggable = target => draggables.includes(target)

const defaultOptions = {
	highlight: true
}

const on = (target, onStart = null, onMove = null, onEnd = null, paramOptions = {}) => {
	draggables.push(target)

	let initialCoords = null
	let inProgress = false


	const handleDown = e => {
		Input.makeHot(target)
		initialCoords = {
			x: e.data.global.x,
			y: e.data.global.y			
		}
	}

	const handleMove = e => {
		if (!inProgress && Input.isHot(target)) {
			let coords = {
				x: e.data.global.x,
				y: e.data.global.y			
			}
			if (Util.distance(initialCoords, coords) >= DRAG_DISTANCE) {
				Input.clear()
				Util.execute(onStart, initialCoords)
				inProgress = true
			}
		}

		if (inProgress) {
			Util.execute(onMove, {
				x: e.data.global.x,
				y: e.data.global.y			
			})		
		}
	}

	const handleEnd = e => {
		if (inProgress) {
			e.stopPropagation()
			inProgress = false
			Util.execute(onEnd, {
				x: e.data.global.x,
				y: e.data.global.y			
			})
		}
	}

	const options = Object.assign({}, defaultOptions, paramOptions)

	if (options.highlight) {
		target.cursor = 'grab'
	}

	let addHint = () => {}
	let removeHint = () => {}
	if (options.helpText) {	
		const hint = {
			action: 'drag',
			text: options.helpText
		}

		addHint = () => {
			Hints.add(hint)
		}
		removeHint = () => {
			Hints.remove(hint)
		}
	}

	target.interactive = true
	target
		.on('mousedown', handleDown)
		.on('touchstart', handleDown)
		.on('mousemove', handleMove)
		.on('touchmove', handleMove)
		.on('mouseup', handleEnd)
		.on('mouseupoutside', handleEnd)
		.on('touchend', handleEnd)
		.on('touchendoutside', handleEnd)
		.on('mouseover', addHint)
		.on('mouseout', removeHint)

	const unsubscribe = () => {
		draggables = draggables.filter(t => t !== target)
		target
			.off('mousedown', handleDown)
			.off('touchstart', handleDown)
			.off('mousemove', handleMove)
			.off('touchmove', handleMove)
			.off('mouseup', handleEnd)
			.off('mouseupoutside', handleEnd)
			.off('touchend', handleEnd)
			.off('touchendoutside', handleEnd)
			.off('mouseover', addHint)
			.off('mouseout', removeHint)
	}

	return unsubscribe
}



const drags = {
	current: null
}
const listen = fn => Binding.listen(drags, 'current', fn)
const update = value => Binding.update(drags, 'current', value)

const waitForDrag = () => new Promise(resolve => {
	if (!drags.current) {
		resolve()
	} else {	
		const unsubscribe = listen(currentDrag => {
			if (!currentDrag) {
				Util.execute(unsubscribe)
				resolve()
			}
		})
	}
})

let dragTargets = []
const makeDraggable = (sprite, entity, helpText) => {
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
		update(entity)
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
				update(null)
				return
			}
		}
		sprite.interactive = true
		sprite.x = initialSpriteCoords.x
		sprite.y = initialSpriteCoords.y
		update(null)
	}

	return on(sprite, start, move, end, { helpText })
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
	waitForDrag,
	makeDraggable,
	makeDragTarget,
	listen,
	isDraggable
}