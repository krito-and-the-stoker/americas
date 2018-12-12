import TWEEN from '@tweenjs/tween.js'

const initialize = () => {
	const updateTween = time => {
		requestAnimationFrame(updateTween)
    TWEEN.update(time);		
	}

	requestAnimationFrame(updateTween)
}

export default { initialize }