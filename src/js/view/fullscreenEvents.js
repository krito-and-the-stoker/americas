import * as PIXI from 'pixi.js'

import Util from 'util/util'
import Record from 'util/record'
import Tween from 'util/tween'
import Events from 'util/events'

import Time from 'timeline/time'

import Tile from 'entity/tile'
import MapEntity from 'entity/map'
import Owner from 'entity/owner'
import Europe from 'entity/europe'
import Storage from 'entity/storage'

import Click from 'input/click'

import Resources from 'render/resources'
import RenderView from 'render/view'
import Foreground from 'render/foreground'
import Text from 'render/text'

import EuropeView from 'view/europe'


const create = (name, text) => {
	markHappend(name)

	const container = new PIXI.Container()

	const background = Resources.sprite('white')
	background.tint = 0x000000

	const image = Resources.sprite(name)
	const originalDimensions = {
		x: image.width,
		y: image.height
	}

	const padding = 30
	const relativeWidth = 0.35
	const plane9 = new PIXI.mesh.NineSlicePlane(Resources.texture('status'), 100, 100, 100, 100)
	const textView = Text.create(text)
	textView.y = padding
	plane9.addChild(textView)


	const unsubscribeDimensions = RenderView.listen.dimensions(dimensions => {
		background.width = dimensions.x
		background.height = dimensions.y

		const scale = Math.min(dimensions.x / originalDimensions.x, dimensions.y / originalDimensions.y)
		image.scale.set(0.9 * scale)
		image.x = (dimensions.x - image.width) / 2
		image.y = (dimensions.y - image.height) / 2

		textView.style = {
			...textView.style,
			wordWrap: true,
			wordWrapWidth: relativeWidth * dimensions.x
		}
		textView.x = padding + (relativeWidth * dimensions.x - textView.width) / 2

		plane9.width = relativeWidth * dimensions.x + 2 * padding
		plane9.height = textView.y + textView.height + padding
		plane9.x = dimensions.x / 2 - plane9.width / 2
		plane9.y = 0.925 * dimensions.y - plane9.height
	})


	container.addChild(background)
	container.addChild(image)
	container.addChild(plane9)
	Time.pause()

	let clickEnabled = false
	setTimeout(() => {
		clickEnabled = true
	}, 2000)

	const unsubscribe = [
		unsubscribeDimensions,
		() => {
			container.removeChild(background)
			container.removeChild(image)
			container.removeChild(plane9)
			Time.resume()
		},
		Click.on(background, () => {
			if (clickEnabled) {
				Tween.fadeOut(image, 500)
				Tween.fadeOut(plane9, 500)
				setTimeout(Foreground.closeScreen, 500)
			}
		})
	]

	Tween.fadeIn(background, 2000)
	Tween.fadeIn(image, 2000)
	Tween.fadeIn(plane9, 2000)

	Foreground.openScreen({
		container,
		unsubscribe,
		priority: true,
	}, {
		name: 'fullscreen-event',
		type: name
	})
}

const hasHappend = name => Record.getGlobal('fullscreen-events')[name]
const markHappend = name => Record.getGlobal('fullscreen-events')[name] = true
const initGlobals = () => {
	if (!Record.getGlobal('fullscreen-events')) {
		Record.setGlobal('fullscreen-events', {})
	}
}

const initialize = () => {
	initGlobals()

	if (!hasHappend('discovery')) {	
		const unsubscribe = MapEntity.get().tiles
			.filter(tile => tile.domain === 'land')
			.filter(tile =>
				Tile.diagonalNeighbors(tile).some(n => n.domain === 'sea'))
			.map(tile => 
				Tile.listen.discovered(tile, discovered => {
					if (discovered && !hasHappend('discovery')) {
						create('discovery', 'You have discovered a new continent!')
						Events.trigger('discovery')
						Util.execute(unsubscribe)
					}
				})
			)
	}

	if (!hasHappend('firstColony')) {
		const unsubscribe = Record.listen('colony', colony => {
			if (colony.owner === Owner.player() && !hasHappend('first-colony')) {
				create('firstColony', 'Building a colony')
				Util.execute(unsubscribe)
			}
		})
	}

	if (!hasHappend('enteringVillage')) {
		const unsubscribe = Events.listen('notification', ({ type }) => {
			if (type === 'settlement' && !hasHappend('enteringVillage')) {
				create('enteringVillage', 'Entering a native village')
				Util.execute(unsubscribe)
			}
		})
	}

	// if (!hasHappend('firstFreight')) {
	// 	const unsubscribe = Europe.listen.units(units => {
	// 		if (units.some(unit => unit.domain === 'sea' && Storage.split(unit.storage).length > 0)) {
	// 			create('firstFreight', 'Cargo from the new world')
	// 			EuropeView.open()
	// 			unsubscribe()
	// 		}
	// 	})
	// }
}

export default { initialize }