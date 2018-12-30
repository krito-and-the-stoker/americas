import * as PIXI from 'pixi.js'
import TWEEN from '@tweenjs/tween.js'

import Util from '../util/util'
import Foreground from '../render/foreground'

const BLINK_TIME = 500

let activeUnit = null
let map = null

const initialize = async () => {
	[map] = await Util.loadTexture('images/map.png')
}

let blinkTween = null
const activateUnit = unit => {
	if (unit != activeUnit) {
		if (blinkTween) {
			blinkTween.stop()
		}
		blinkTween = new TWEEN.Tween({ alpha: 1 })
			.to({ alpha: 0 }, BLINK_TIME)
			.easing(TWEEN.Easing.Quadratic.Out)
			.onUpdate(({ alpha }) => unit.sprite.alpha = alpha)
			.onStop(() => unit.sprite.alpha = 1)
			.repeat(Infinity)
			.yoyo(true)
			.start()
	}
}

const createSprite = unit => {
	const sprite = new PIXI.Sprite(new PIXI.Texture(map, Util.rectangle(unit.id)))
	sprite.x = unit.pixelCoordinates.x
	sprite.y = unit.pixelCoordinates.y
	Foreground.add(sprite)
	sprite.interactive = true
	sprite.on('pointerdown', e => {
		// e.data.originalEvent.stopPropagation()
		// e.data.originalEvent.stopImmediatePropagation()
		// e.data.originalEvent.preventDefault()
		// e.stopPropagation()
		activateUnit(unit)
	})
	return sprite
}


export default {
	createSprite,
	initialize
}
