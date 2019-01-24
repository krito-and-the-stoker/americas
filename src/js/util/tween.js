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
		.start()
})

export default { initialize, fadeIn, moveTo, moveFrom }