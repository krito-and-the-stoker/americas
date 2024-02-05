import TWEEN from '@tweenjs/tween.js'

const initialize = () => {
	const updateTween = time => {
		requestAnimationFrame(updateTween)
		TWEEN.update(time)
	}

	requestAnimationFrame(updateTween)
}

const fadeTo = (target, alpha, time) => {
	return new Promise(resolve => {
		new TWEEN.Tween({ alpha: target.alpha })
			.to({ alpha }, time)
			.easing(TWEEN.Easing.Quadratic.In)
			.onUpdate(({ alpha }) => {
				target.alpha = alpha
			})
			.onStop(() => {
				sprite.alpha = alpha
				resolve()
			})
			.onComplete(resolve)
			.start()
	})
}

const fadeIn = (sprite, time) => {
	sprite.alpha = 0
	return fadeTo(sprite, 1, time)
}

const fadeOut = (sprite, time) => {
	sprite.alpha = 1
	return fadeTo(sprite, 0, time)
}

const moveTo = (sprite, to, time) => new Promise(resolve => {	
	const from = {
		x: sprite.x,
		y: sprite.y
	}

	new TWEEN.Tween(from)
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

	new TWEEN.Tween(from)
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
	new TWEEN.Tween({ scale: initialScale })
		.to({ scale }, time)
		.easing(TWEEN.Easing.Quadratic.InOut)
		.onUpdate(({ scale }) => sprite.scale.set(scale))
		.onStop(() => sprite.scale.set(scale))
		.onComplete(resolve)
		.start()
})

const wait = (time) => new Promise(resolve => {
	setTimeout(resolve, time)
})

export default {
	initialize,
	fadeIn,
	fadeOut,
	fadeTo,
	moveTo,
	moveFrom,
	scaleTo,
	wait
}