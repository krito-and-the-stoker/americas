import Icons from '../../data/icons.json'

import EuropeView from '../europe'
import Ressources from '../../render/ressources'
import Util from '../../util/util'
import UnitView from '../unit'
import Foreground from '../../render/foreground'
import RenderView from '../../render/view'
import Click from '../../input/click'
import Secondary from '../../input/secondary'
import MapView from '../../view/map'


const originalDimensions = {
	x: 1920,
	y: 1080
}
let container = null
let notifications = []


const createEuropeNotification = unit => {
	const container = new PIXI.Container()
	const icon = new PIXI.Sprite(new PIXI.Texture(Ressources.get().mapTiles, Util.rectangle(Icons.europe)))
	const unitView = UnitView.create(unit)

	const scale = 0.5
	unitView.x = (1 - scale) * 64
	unitView.y = (1 - scale) * 64
	unitView.scale.set(scale)
	
	container.addChild(icon)
	container.addChild(unitView)

	const action = () => EuropeView.open()

	return {
		container,
		action,
		type: 'europe'
	}
}

const createAmericaNotification = unit => {
	const container = new PIXI.Container()
	const icon = new PIXI.Sprite(new PIXI.Texture(Ressources.get().mapTiles, Util.rectangle(Icons.america)))
	const unitView = UnitView.create(unit)

	const scale = 0.5
	unitView.x = (1 - scale) * 64
	unitView.y = (1 - scale) * 64
	unitView.scale.set(scale)
	
	container.addChild(icon)
	container.addChild(unitView)

	const action = () => MapView.centerAt(unit.mapCoordinates, 350)

	return {
		container,
		action,
		type: 'america'
	}}

const remove = notification => {
	container.removeChild(notification.container)
	notifications = notifications.filter(n => n !== notification)
}

const createType = {
	europe: params => createEuropeNotification(params.unit),
	america: params => createAmericaNotification(params.unit)
}
const create = params => {
	const notification = createType[params.type](params)
	notification.container.x += notifications.length * 74

	container.addChild(notification.container)
	Click.on(notification.container, () => {
		notification.action()
		remove(notification)
	})
	Secondary.on(notification.container, () => remove(notification))
	notifications.push(notification)
}

const initialize = () => {
	container = new PIXI.Container()
	Foreground.get().permanent.addChild(container)

	RenderView.updateWhenResized(({ dimensions }) => {
		const scale = Math.min(dimensions.x / originalDimensions.x, dimensions.y / originalDimensions.y)
		window.scale = scale
		window.dimensions = dimensions
		window.originalDimensions = originalDimensions
		window.container = container

		container.x = dimensions.x / 2
		container.y = dimensions.y - 74
		// container.scale.set(scale)
	})
}

export default {
	create,
	initialize
}