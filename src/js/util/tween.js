import TWEEN from '@tweenjs/tween.js'

const initialize = () => {
	const updateTween = time => {
		requestAnimationFrame(updateTween)
    TWEEN.update(time);		
	}

	requestAnimationFrame(updateTween)
}

const fadeIn = (sprite, time) => new Promise(resolve => {	
	sprite.alpha = 0
	const tween = new TWEEN.Tween({ alpha: 0 })
		.to({ alpha: 1 }, time)
		.easing(TWEEN.Easing.Quadratic.Out)
		.onUpdate(({ alpha }) => sprite.alpha = alpha)
		.onStop(() => {
			sprite.alpha = 1
			resolve()
		})
		.onComplete(resolve)
		.start()
})

const fadeOut = (sprite, time) => new Promise(resolve => {	
	sprite.alpha = 1
	const tween = new TWEEN.Tween({ alpha: 1 })
		.to({ alpha: 0 }, time)
		.easing(TWEEN.Easing.Quadratic.Out)
		.onUpdate(({ alpha }) => sprite.alpha = alpha)
		.onStop(() => {
			sprite.alpha = 0
			resolve()
		})
		.onComplete(resolve)
		.start()
})

const moveTo = (sprite, to, time) => new Promise(resolve => {	
	const from = {
		x: sprite.x,
		y: sprite.y
	}

	const tween = new TWEEN.Tween(from)
		.to(to, time)
		.easing(TWEEN.Easing.Quadratic.InOut)
		.onUpdate(({ x, y }) => {
			sprite.x = x
			sprite.y = y
		})
		.onStop(() => {
			sprite.x = to.x
			sprite.y = to.y
			resolve()
		})
		.onComplete(resolve)
		.start()
})


const moveFrom = (sprite, from, time) => new Promise(resolve => {
	const to = {
		x: sprite.x,
		y: sprite.y
	}
	sprite.x = from.x
	sprite.y = from.y

	const tween = new TWEEN.Tween(from)
		.to(to, time)
		.easing(TWEEN.Easing.Quadratic.InOut)
		.onUpdate(({ x, y }) => {
			sprite.x = x
			sprite.y = y
		})
		.onStop(() => {
			sprite.x = to.x
			sprite.y = to.y
			resolve()
		})
		.onComplete(resolve)
		.start()
})

const scaleTo = (sprite, scale, time) => new Promise(resolve => {
	const initialScale = sprite.scale.x
	const tween = new TWEEN.Tween({ scale: initialScale })
		.to({ scale })
		.easing(TWEEN.Easing.Quadratic.InOut)
		.onUpdate(({ scale }) => sprite.scale.set(scale))
		.onStop(() => sprite.scale.set(scale))
		.onComplete(resolve)
		.start()
})

export default {
	initialize,
	fadeIn,
	fadeOut,
	moveTo,
	moveFrom,
	scaleTo
}