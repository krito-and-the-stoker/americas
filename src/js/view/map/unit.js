import * as PIXI from 'pixi.js'
import TWEEN from '@tweenjs/tween.js'

import Goods from 'data/goods.json'

import Tween from 'util/tween'
import Util from 'util/util'
import Record from 'util/record'
import Binding from 'util/binding'

import Foreground from 'render/foreground'
import Resources from 'render/resources'

import Click from 'input/click'
import Secondary from 'input/secondary'

import Unit from 'entity/unit'
import Europe from 'entity/europe'
import Colonist from 'entity/colonist'
import Owner from 'entity/owner'
import Tile from 'entity/tile'
import Storage from 'entity/storage'

import ColonyView from 'view/colony'
import Events from 'util/events'

import Dialog from 'view/ui/dialog'


const BLINK_TIME = 500
const TILE_SIZE = 64

const state = {
	selectedView: null
}

const listen = {
	selectedView: fn => Binding.listen(state, 'selectedView', fn)
}

const update = {
	selectedView: value => Binding.update(state, 'selectedView', value)
}

let blinkTween = null
const select = unit => {
	console.log('select', unit)
	const view = getView(unit)
	if (view.destroyed) {
		return
	}
	if (view != state.selectedView) {
		if (state.selectedView) {
			unselect()
		}
		update.selectedView(view)
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

		Events.trigger('select', view.unit)
	}
}

const unselect = (unit = null) => {
	if (!unit || (state.selectedView && unit === state.selectedView.unit)) {	
		const previouslySelectedView = state.selectedView
		update.selectedView(null)
		updateVisibility(previouslySelectedView)
		if (blinkTween) {
			blinkTween.stop()
			blinkTween = null
		}
	}
}

const updateTexture = view => {
	const frame = view.unit.expert ? view.unit.properties.frame[view.unit.expert] || view.unit.properties.frame.default : view.unit.properties.frame.default
	view.sprite.texture = Resources.texture('map', { frame })
}

const updatePosition = view => {
	view.circle.x = TILE_SIZE * view.unit.mapCoordinates.x + TILE_SIZE / 2
	view.circle.y = TILE_SIZE * view.unit.mapCoordinates.y + TILE_SIZE / 2
	view.sprite.x = TILE_SIZE * view.unit.mapCoordinates.x
	view.sprite.y = TILE_SIZE * view.unit.mapCoordinates.y
}

const create = unit => {
	const frame = unit.expert ? unit.properties.frame[unit.expert] || unit.properties.frame.default : unit.properties.frame.default
	const sprite = Resources.sprite('map', { frame })
	if (unit.domain === 'land') {
		sprite.hitArea = new PIXI.Rectangle(TILE_SIZE / 4, 0, TILE_SIZE / 2, TILE_SIZE)
	}

	const circle = new PIXI.Graphics()
	// circle.lineStyle(2, unit.owner.color)
	circle.beginFill(unit.owner.color, 0.3)
	circle.drawCircle(0, 0, TILE_SIZE)
	circle.endFill()
	// circle.alpha = 0.5

	const view = {
		sprite,
		circle,
		unit,
	}

	return view
}

const selectedUnit = () => state.selectedView ? state.selectedView.unit : null

const destroy = view => {
	unselect(view.unit)
	view.destroyed = true
	Util.execute(view.unsubscribe)
	Tween.fadeOut(view.sprite, 1000)
	Tween.fadeOut(view.circle, 1000).then(() => {
		hide(view)	
	})
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
	if (!view.destroyed) {
		Foreground.addUnit(view.circle)
		Foreground.addUnit(view.sprite)
	}
}

const hide = view => {
	unselect(view.unit)
	Foreground.removeUnit(view.circle)
	Foreground.removeUnit(view.sprite)
}

const updateRadius = view => {
	view.circle.scale.set(0.5 * view.unit.radius)
}


const createFoodDeclineMapping = () => {
	let lastFood = null
	return storage => {
		const result = lastFood && lastFood > storage.food
		lastFood = storage.food

		return result
	}
}

const updateVisibility = view => visibleOnMap(view) ? show(view) : hide(view)
const visibleOnMap = view => (view === state.selectedView || !view.unit.colony) &&
	!view.unit.vehicle &&
	!Europe.has.unit(view.unit) &&
	!view.unit.offTheMap &&
	!(view.unit.colonist && view.unit.colonist.colony) &&
	(view.unit.owner.visible || Tile.closest(view.unit.mapCoordinates).discovered()) &&
	!view.destroyed

let views = []
const initialize = () => {
	Events.listen('save', () => {
		Record.setGlobal('selectedUnit', Record.reference(selectedUnit()))
	})

	Events.listen('restart', () => {
		const unit = Record.dereference(Record.getGlobal('selectedUnit'))
		if (unit) {
			select(unit)
		}
	})

	Record.listen('unit', unit => {
		const view = create(unit)
		const updateBoundVisibility = () => { updateVisibility(view) }

		view.unsubscribe = [
			Unit.listen.vehicle(unit, updateBoundVisibility),
			Unit.listen.offTheMap(unit, updateBoundVisibility),
			Unit.listen.colony(unit, updateBoundVisibility),
			Owner.listen.visible(unit.owner, updateBoundVisibility),

			Unit.listen.tile(unit, tile =>
				tile ? Tile.listen.discovered(tile, updateBoundVisibility) : null),

			Unit.listen.colonist(unit, colonist =>
				colonist ? Colonist.listen.colony(colonist, updateBoundVisibility) : updateBoundVisibility()),

			Unit.listen.mapCoordinates(unit, () => { updatePosition(view) }),
			Unit.listen.properties(unit, () => { updateTexture(view) }),
			Unit.listen.expert(unit, () => { updateTexture(view) }),
			Unit.listen.radius(unit, () => { updateRadius(view)} ),
			Unit.listen.properties(unit, properties =>
				properties.needsFood && Storage.listen(unit.equipment, Binding.map(createFoodDeclineMapping(), decline => {
					if (decline) {					
						const icon = Resources.sprite('map', { frame: Goods.food.id })
						icon.scale.set(0.5, 0.5)
						icon.position.x = 32					
						view.sprite.addChild(icon)
						return [
							() => { view.sprite.removeChild(icon) },
							Storage.listen(unit.equipment, storage => {
								const redness = Util.clamp(1 - storage.food / Unit.UNIT_FOOD_CAPACITY)
								icon.tint = Util.interpolateColors(0xFFFFFF, 0xFF0000, redness)
							})
						]
					}
				}))),

			Unit.computed.pioneering(unit, pioneering => {
				if (pioneering) {
					lookGrey(view)
					unselect(unit)
				} else {
					lookNormal(view)
				}
			}),

			Owner.listen.input(unit.owner, input =>
				input ? Click.on(view.sprite, () => {
					if (unit.colony && unit.colony.owner === unit.owner) {
						unit.colony.screen = ColonyView.open(unit.colony)
					} else {
						if (unit === selectedUnit()) {
							// cycle through units on tile
							const others = Unit.at(unit.mapCoordinates)
							const index = (others.indexOf(unit) + 1) % others.length
							select(others[index])
						} else {
							select(unit)
						}
					}
				}) : null),

			// Owner.listen.input(unit.owner, input =>
			// 	!input ? Secondary.on(view.sprite, () => {
			// 		if (selectedUnit()) {
			// 			Dialog.create({
			// 				type: 'marshal',
			// 				text: 'Shall we attack?',
			// 				options: [{
			// 					text: 'Attack!',
			// 					action: () => {
			// 						console.warn('Feature has been revoked for now')
			// 					}
			// 				}, {
			// 					text: 'No'
			// 				}]
			// 			})
			// 		}
			// 	}) : null)
		]

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
	listen,
	update
}
