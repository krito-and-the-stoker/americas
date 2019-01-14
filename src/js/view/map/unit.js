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
import Colonist from '../../entity/colonist'

const BLINK_TIME = 500
const TILE_SIZE = 64

let selectedView = null
let blinkTween = null
const select = unit => {
	const view = getView(unit)
	if (view != selectedView) {
		if (selectedView) {
			unselect()
		}
		selectedView = view
		updateVisibility(view)
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
	if (!unit || (selectedView && unit === selectedView.unit)) {	
		const previouslySelectedView = selectedView
		selectedView = null
		updateVisibility(previouslySelectedView)
		if (blinkTween) {
			blinkTween.stop()
			blinkTween = null
		}
	}
}

const updateTexture = view => {
	const frame = view.unit.expert ? view.unit.properties.frame[view.unit.expert] || view.unit.properties.frame.default : view.unit.properties.frame.default
	const texture = new PIXI.Texture(Ressources.get().mapTiles, Util.rectangle(frame))
	view.sprite.texture = texture
}

const updatePosition = view => {
	view.sprite.x = TILE_SIZE * view.unit.mapCoordinates.x
	view.sprite.y = TILE_SIZE * view.unit.mapCoordinates.y
}

const create = unit => {
	const frame = unit.expert ? unit.properties.frame[unit.expert] || unit.properties.frame.default : unit.properties.frame.default
	const sprite = new PIXI.Sprite(new PIXI.Texture(Ressources.get().mapTiles, Util.rectangle(frame)))
	if (unit.domain === 'land') {
		sprite.hitArea = new PIXI.Rectangle(TILE_SIZE / 4, 0, TILE_SIZE / 2, TILE_SIZE)
	}

	const view = {
		sprite,
		unit
	}

	Foreground.addUnit(sprite)

	Click.on(sprite, () => {
		if (unit.colony) {
			unit.colony.screen = ColonyView.open(unit.colony)
		} else {
			select(unit)
		}
	})

	return view
}

const selectedUnit = () => selectedView ? selectedView.unit : null

const destroy = view => {
	hide(view)	
}


const greyScaleFilter = new PIXI.filters.ColorMatrixFilter()
const lookGrey = view => {
	view.sprite.filters = [greyScaleFilter]
	greyScaleFilter.blackAndWhite()
}

const lookNormal = view => {
	view.sprite.filters = []
}

const show = view => {
	Foreground.addUnit(view.sprite)
}

const hide = view => {
	unselect(view.unit)
	Foreground.removeUnit(view.sprite)
}

const updateVisibility = view => visibleOnMap(view) ? show(view) : hide(view)
const visibleOnMap = view => (view === selectedView || !view.unit.colony) &&
	!view.unit.vehicle &&
	!Europe.has.unit(view.unit) &&
	!view.unit.offTheMap &&
	!(view.unit.colonist && view.unit.colonist.colony)

const save = () => Record.reference(selectedUnit())
const load = data => {
	const unit = Record.dereference(data)
	if (unit) {
		select(unit)
	}
}

let views = []
const initialize = () => {
	Record.listen('unit', unit => {
		const view = create(unit)
		const updateBoundVisibility = () => { updateVisibility(view) }
		Unit.listen.vehicle(unit, updateBoundVisibility)
		Unit.listen.offTheMap(unit, updateBoundVisibility)
		Unit.listen.colony(unit, updateBoundVisibility)
		Unit.listen.colonist(unit, colonist =>
			colonist ? Colonist.listen.colony(colonist, updateBoundVisibility) : updateBoundVisibility())

		Unit.listen.mapCoordinates(unit, () => { updatePosition(view) })
		Unit.listen.properties(unit, () => { updateTexture(view) })
		Unit.listen.expert(unit, () => { updateTexture(view) })
		Unit.listen.pioneering(unit, pioneering => {
			if (pioneering) {			
				lookGrey(view)
				unselect(unit)
			} else {
				lookNormal(view)
			}
		})

		views.push(view)

		return () => {
			destroy(view)
		}
	})
}

const getView = unit => views.find(view => view.unit === unit)

export default {
	initialize,
	getView,
	selectedUnit,
	select,
	unselect,
	load,
	save
}
