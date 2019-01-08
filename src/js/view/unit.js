import * as PIXI from 'pixi.js'
import TWEEN from '@tweenjs/tween.js'

import Util from '../util/util'
import Foreground from '../render/foreground'
import Ressources from '../render/ressources'
import Click from '../input/click'
import Secondary from '../input/secondary'
import Record from '../util/record'
import ColonyView from '../view/colony'

const BLINK_TIME = 500
const TILE_SIZE = 64

let activeUnit = null
const get = () => ({
	activeUnit
})

let blinkTween = null
const select = unit => {
	if (unit != activeUnit) {
		if (activeUnit) {
			unselect()
		}
		activeUnit = unit
		activate(activeUnit)
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

const unselect = () => {
	const unit = activeUnit
	activeUnit = null

	if (unit.colony) {
		deactivate(unit)
	}
}

const activate = unit => {
	if (!unit.active) {
		unit.sprite.x = TILE_SIZE * unit.mapCoordinates.x
		unit.sprite.y = TILE_SIZE * unit.mapCoordinates.y
		Foreground.addUnit(unit.sprite)
		unit.active = true
	}
}

const deactivate = unit => {
	if (unit.active) {
		if (unit === activeUnit) {
			unselect()
		}
		Foreground.removeUnit(unit.sprite)
		unit.active = false
	}
}

const createSprite = unit => {
	const frame = unit.expert ? unit.frame[unit.expert] || unit.frame.default : unit.frame.default
	const sprite = new PIXI.Sprite(new PIXI.Texture(Ressources.get().mapTiles, Util.rectangle(frame)))
	if (unit.mapCoordinates) {	
		sprite.x = TILE_SIZE * unit.mapCoordinates.x
		sprite.y = TILE_SIZE * unit.mapCoordinates.y
	} else {
		deactivate(unit)
	}
	if (unit.active) {
		Foreground.addUnit(sprite)
	}
	Click.on(sprite, () => {
		if (unit.colony) {
			unit.colony.screen = ColonyView.createDetailScreen(unit.colony)
			Foreground.openScreen(unit.colony.screen)			
		} else {
			select(unit)
		}
	})

	return sprite
}

const createColonySprite = unit => {
	const frame = unit.expert ? unit.frame[unit.expert] || unit.frame.default : unit.frame.default
	const sprite = new PIXI.Sprite(new PIXI.Texture(Ressources.get().mapTiles, Util.rectangle(frame)))
	sprite.scale.set(2)

	return sprite	
}


const save = () => Record.reference(activeUnit)
const load = data => {
	const unit = Record.dereference(data)
	if (unit) {
		select(unit)
	}
}


export default {
	createSprite,
	createColonySprite,
	activate,
	deactivate,
	select,
	get,
	load,
	save
}
