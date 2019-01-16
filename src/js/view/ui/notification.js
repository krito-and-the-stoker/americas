import Icons from '../../data/icons.json'
import Terrain from '../../data/terrain.json'

import EuropeView from '../europe'
import Ressources from '../../render/ressources'
import Util from '../../util/util'
import UnitView from '../unit'
import Foreground from '../../render/foreground'
import RenderView from '../../render/view'
import Click from '../../input/click'
import Secondary from '../../input/secondary'
import MapView from '../../view/map'
import UnitMapView from '../../view/map/unit'
import ColonyMapView from '../../view/map/colony'
import ColonyView from '../../view/colony'
import MapEntity from '../../entity/map'
import Background from '../../render/background'
import Dialog from './dialog'


const originalDimensions = {
	x: 1920,
	y: 1080
}
let container = null
let notifications = []

const createSprite = frame => new PIXI.Sprite(new PIXI.Texture(Ressources.get().mapTiles, Util.rectangle(frame)))
const createIcon = name => createSprite(Icons[name])

const createEuropeNotification = unit => {
	const container = new PIXI.Container()
	const icon = createIcon('europe')
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
	const icon = createIcon('america')
	const unitView = UnitView.create(unit)

	const scale = 0.5
	unitView.x = (1 - scale) * 64
	unitView.y = (1 - scale) * 64
	unitView.scale.set(scale)
	
	container.addChild(icon)
	container.addChild(unitView)

	const action = () => {
		MapView.centerAt(unit.mapCoordinates, 350)
		UnitMapView.select(unit)
	}

	return {
		container,
		action,
		type: 'america'
	}
}

const createConstructionNotification = colony => {
	const container = new PIXI.Container()
	const colonySprite = ColonyMapView.createSprite(colony)
	const icon = createIcon('plus')

	const scale = 0.5
	icon.x = (1 - scale) * 64
	icon.y = (1 - scale) * 64
	icon.scale.set(scale)
	
	container.addChild(colonySprite)
	container.addChild(icon)

	const action = () => ColonyView.open(colony)

	return {
		container,
		action,
		type: 'america'
	}
}

const createTerraformingNotification = unit => {
	const tile = MapEntity.tile(unit.mapCoordinates)
	
	const container = new PIXI.Container()
	
	const circle = new PIXI.Graphics()
	circle.beginFill(0xFFFFFF)
	circle.drawCircle(32, 32, 26)
	circle.endFill()
	container.addChild(circle)

	const tileSprites = Background.createSpritesFromTile(tile)
	tileSprites.forEach(s => s.mask = circle)
	const unitSprite = UnitView.create(unit)

	scale = 0.5
	unitSprite.x = (1 - scale) * 64
	unitSprite.y = (1 - scale) * 64
	unitSprite.scale.set(scale)

	tileSprites.forEach(t => container.addChild(t))
	container.addChild(unitSprite)

	const action = () => {
		MapView.centerAt(unit.mapCoordinates, 350)
		UnitMapView.select(unit)
	}

	return {
		container,
		action,
		type: 'terraforming'
	}
}

const createRumorNotification = (option, tile) => {
	const container = new PIXI.Container()
	const rumors = createSprite(Terrain.rumors.id - 1)
	const icon = createIcon('question')

	scale = 0.5
	icon.x = (1 - scale) * 64
	icon.y = (1 - scale) * 64
	icon.scale.set(scale)

	container.addChild(rumors)
	container.addChild(icon)

	const action = () => {
		MapView.centerAt(tile.mapCoordinates, 350)
		Dialog.createIndependent(option.text, ['ok'], null, { pause: true })

		option.fn()
		tile.rumors = false
		Background.render()
	}

	return {
		container,
		action,
		type: 'rumor'
	}
}


const remove = notification => {
	container.removeChild(notification.container)
	notifications = notifications.filter(n => n !== notification)
	notifications.forEach((n, i) => n.container.x = i*74)
}

const createType = {
	europe: params => createEuropeNotification(params.unit),
	america: params => createAmericaNotification(params.unit),
	construction: params => createConstructionNotification(params.colony),
	terraforming: params => createTerraformingNotification(params.unit),
	rumor: params => createRumorNotification(params.option, params.tile)
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