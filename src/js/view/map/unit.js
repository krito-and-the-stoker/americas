import * as PIXI from 'pixi.js'
import TWEEN from '@tweenjs/tween.js'

import Util from '../../util/util'
import Foreground from '../../render/foreground'
import Ressources from '../../render/ressources'
import Click from '../../input/click'
import Secondary from '../../input/secondary'
import Record from '../../util/record'
import ColonyView from '../../view/colony'
import Unit from '../../entity/unit'
import Europe from '../../entity/europe'

const BLINK_TIME = 500
const TILE_SIZE = 64

let selectedView = null
let blinkTween = null
const select = view => {
	if (view != selectedView) {
		if (selectedView) {
			unselect()
		}
		selectedView = view
		if (blinkTween) {
			blinkTween.stop()
		}
		blinkTween = new TWEEN.Tween({ alpha: 1 })
			.to({ alpha: 0 }, BLINK_TIME)
			.easing(TWEEN.Easing.Quadratic.Out)
			.onUpdate(({ alpha }) => view.sprite.alpha = alpha)
			.onStop(() => view.sprite.alpha = 1)
			.repeat(Infinity)
			.yoyo(true)
			.start()
	}
}

const unselect = (unit = null) => {
	if (!unit || unit === selectedView.unit) {	
		selectedView = null
		if (blinkTween) {
			blinkTween.stop()
			blinkTween = null
		}
	}
}

const updateType = unit => {
	const frame = unit.expert ? unit.properties.frame[unit.expert] || unit.properties.frame.default : unit.properties.frame.default
	const texture = new PIXI.Texture(Ressources.get().mapTiles, Util.rectangle(frame))
	unit.sprite.texture = texture
	if (unit.colonySprite) {
		unit.colonySprite.texture = texture
	}
}

const create = unit => {
	const frame = unit.expert ? unit.properties.frame[unit.expert] || unit.properties.frame.default : unit.properties.frame.default
	const sprite = new PIXI.Sprite(new PIXI.Texture(Ressources.get().mapTiles, Util.rectangle(frame)))
	sprite.x = TILE_SIZE * unit.mapCoordinates.x
	sprite.y = TILE_SIZE * unit.mapCoordinates.y

	const view = {
		sprite,
		unit
	}

	Foreground.addUnit(sprite)

	Click.on(sprite, () => {
		if (unit.colony) {
			unit.colony.screen = ColonyView.createDetailScreen(unit.colony)
			Foreground.openScreen(unit.colony.screen)			
		} else {
			select(view)
		}
	})

	return view
}

const selectedUnit = () => selectedView ? selectedView.unit : null


const greyScaleFilter = new PIXI.filters.ColorMatrixFilter()
const lookGrey = unit => {
	const view = getView(unit)
	view.sprite.filters = [greyScaleFilter]
	greyScaleFilter.blackAndWhite()
}

const lookNormal = unit => {
	const view = getView(unit)
	view.sprite.filters = []
}

const show = view => {
	Foreground.addUnit(view.sprite)
}

const hide = view => {
	Foreground.removeUnit(view.sprite)
}

const visibleOnMap = view => (view === selectedView || !view.unit.colony) && !view.unit.vehicle && !Europe.has.unit(view.unit)


const save = () => Record.reference(selectedView)
const load = data => {
	const unit = Record.dereference(data)
	if (unit) {
		select(unit)
	}
}

let views = []
const initialize = () => {
	Record.listen('unit', unit => {
		console.log('create', unit)
		const view = create(unit)
		Unit.listen.vehicle(unit, () => {
			if (visibleOnMap(view)) {
				show(view)
			} else {
				hide(view)
			}
		})

		views.push(view)
	})
}

const getView = unit => views.find(view => view.unit === unit)

export default {
	initialize,
	getView,
	selectedUnit,
	select,
	unselect,
	lookGrey,
	lookNormal,
	load,
	save
}
