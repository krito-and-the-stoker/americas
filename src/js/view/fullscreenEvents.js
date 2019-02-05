import * as PIXI from 'pixi.js'

import Util from 'util/util'
import Record from 'util/record'

import Time from 'timeline/time'

import Tile from 'entity/tile'
import MapEntity from 'entity/map'

import Click from 'input/click'

import Resources from 'render/resources'
import RenderView from 'render/view'
import Foreground from 'render/foreground'


const create = name => {
	markHappend(name)

	const container = new PIXI.Container()

	const background = Resources.sprite('white')
	background.tint = 0x000000

	const image = Resources.sprite('discovery')
	const originalDimensions = {
		x: image.width,
		y: image.height
	}

	const unsubscribeDimensions = RenderView.listen.dimensions(dimensions => {
		background.width = dimensions.x
		background.height = dimensions.y

		const scale = Math.min(dimensions.x / originalDimensions.x, dimensions.y / originalDimensions.y)
		image.scale.set(0.9 * scale)
		image.x = (dimensions.x - image.width) / 2
		image.y = (dimensions.y - image.height) / 2
	})

	container.addChild(background)
	container.addChild(image)
	Time.pause()

	const unsubscribe = [
		unsubscribeDimensions,
		() => {
			container.removeChild(background)
			container.removeChild(image)
			Time.resume()
		},
		Click.on(background, Foreground.closeScreen)
	]

	Foreground.openScreen({
		container,
		unsubscribe,
		removePermanent: true,
	}, {
		name: 'fullscreen-event',
		type: 'discovery'
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
		const unsubscribeTiles = MapEntity.get().tiles
			.filter(tile => tile.domain === 'land')
			.map(tile => 
				Tile.listen.discovered(tile, discovered => {
					if (discovered && !Record.getGlobal('fullscreen-events').discovery) {
						Record.getGlobal('fullscreen-events').discovery = true
						create('discovery')
						Util.execute(unsubscribeTiles)
					}
				})
			)
	}
}

export default { initialize }