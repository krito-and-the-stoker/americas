import Background from './background.js'
import Foreground from './foreground.js'
import TWEEN from '@tweenjs/tween.js'

class RenderView {
	constructor(props) {
		Object.assign(this, props)
	}

	static async initialize(mapView) {	
		const background = await Background.initialize(mapView)
		const foreground = await Foreground.initialize()

		let coords = {
			x: 0,
			y: 0,
		}
		let tween = null
		const clickHandler = (e) => {
			let newCoords = {
				x: coords.x - e.clientX + background.layer.width / 2,
				y: coords.y - e.clientY + background.layer.height / 2
			}
			if (tween) {
				tween.stop()
			}
			tween = new TWEEN.Tween(coords)
				.to(newCoords, 350)
				.easing(TWEEN.Easing.Quadratic.Out)
				.onUpdate((current) => {
					foreground.container.x = Math.round(current.x)
					foreground.container.y = Math.round(current.y)
					background.container.x = Math.round(current.x)
					background.container.y = Math.round(current.y)
					background.background.tilePosition.x = Math.round(current.x)
					background.background.tilePosition.y = Math.round(current.y)
					background.render()
				})
				.start()
		}

		window.addEventListener('click', clickHandler)
		function animate(time) {
		    requestAnimationFrame(animate);
		    TWEEN.update(time);
		}
		requestAnimationFrame(animate);

		return new RenderView({
			background,
			foreground
		})
	}
}

export default RenderView
