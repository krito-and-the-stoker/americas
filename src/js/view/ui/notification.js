import Icons from '../../data/icons.json'
import Terrain from '../../data/terrain.json'
import Goods from '../../data/goods.json'

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
import Events from './events'


const originalDimensions = {
	x: 1920,
	y: 1080
}
let container = null
let notifications = []

const createSprite = frame => new PIXI.Sprite(new PIXI.Texture(Ressources.get().mapTiles, Util.rectangle(frame)))
const createIcon = name => createSprite(Icons[name])

const combine = (slot1, slot2, slot3) => {
	const container = new PIXI.Container()

	const slot1Sprites = slot1.length ? slot1 : [slot1]
	slot1Sprites.forEach(s => container.addChild(s))

	let scale1 = 0.5
	let position = {
		x: (1 - scale1) * 64,
		y: (1 - scale1) * 64
	}

	const slot2Sprites = slot2 ? (slot2.length ? slot2 : [slot2]) : []
	slot2Sprites.forEach(s => {
		s.x = position.x
		s.y = position.y
		s.scale.set(scale1)
		container.addChild(s)
	})

	const scale2 = 0.4
	position = {
		x: (1 - scale2 - scale1) * 64,
		y: (1 - scale2) * 64
	}
	const slot3Sprites = slot3 ? (slot3.length ? slot3 : [slot3]) : []
	slot3Sprites.forEach(s => {
		s.x = position.x
		s.y = position.y
		s.scale.set(scale2)
		container.addChild(s)
	})

	return container
}

const createEurope = unit => {
	const icon = createIcon('europe')
	const unitView = UnitView.create(unit)
	const arrow = unit.domain === 'sea' ? createIcon('right') : createIcon('plus')
	const container = combine(icon, unitView, arrow)


	const action = () => EuropeView.open()

	const dismiss = {
		europeScreen: () => true
	}

	return {
		container,
		action,
		type: 'europe',
		dismiss
	}
}

const createAmerica = unit => {
	const icon = createIcon('america')
	const unitView = UnitView.create(unit)
	const arrow = createIcon('left')
	const container = combine(icon, unitView, arrow)

	const action = () => {
		MapView.centerAt(unit.mapCoordinates, 350)
		UnitMapView.select(unit)
	}

	const dismiss = {
		select: u => u === unit
	}

	return {
		container,
		action,
		type: 'america',
		dismiss
	}
}

const createConstruction = colony => {
	const colonySprite = ColonyMapView.createSprite(colony)
	const good = createSprite(Goods.construction.id)
	const icon = createIcon('plus')
	const container = combine(colonySprite, good, icon)

	const action = () => ColonyView.open(colony)

	const dismiss = {
		colonyScreen: c => c === colony
	}

	return {
		container,
		action,
		type: 'america',
		dismiss
	}
}

const createTerraforming = unit => {
	const tile = MapEntity.tile(unit.mapCoordinates)
	
	const circle = new PIXI.Graphics()
	circle.beginFill(0xFFFFFF)
	circle.drawCircle(32, 32, 26)
	circle.endFill()

	const tileSprites = Background.createSpritesFromTile(tile)
	tileSprites.forEach(s => s.mask = circle)
	const unitSprite = UnitView.create(unit)

	const container = combine(tileSprites.concat(circle), unitSprite)

	const action = () => {
		MapView.centerAt(unit.mapCoordinates, 350)
		UnitMapView.select(unit)
	}

	const dismiss = {
		select: u => u === unit
	}

	return {
		container,
		action,
		type: 'terraforming',
		dismiss
	}
}

const createRumor = (option, tile, unit) => {
	const rumors = createSprite(Terrain.rumors.id - 1)
	const icon = createIcon('question')

	const container = combine(rumors, icon)

	const action = () => {
		Dialog.createIndependent(option.text, ['ok', 'go to scout'], null, { pause: true })
			.then(decision => {
				if (decision === 1) {
					MapView.centerAt(unit.mapCoordinates, 350)
					UnitMapView.select(unit)
				}
			})

		option.fn()
		tile.rumors = false
		Background.render()
	}

	const dismiss = {
		move: u => u === unit
	}

	return {
		container,
		action,
		type: 'rumor',
		dismiss
	}
}

const createSettlerBorn = (colony, unit) => {
	const colonySprite = ColonyMapView.createSprite(colony)
	const unitView = UnitView.create(unit)
	const plus = createIcon('plus')
	const container = combine(colonySprite, unitView, plus)

	const action = () => ColonyView.open(colony)
	const dismiss = {
		colonyScreen: c => c === colony
	}

	return {
		container,
		action,
		type: 'born',
		dismiss
	}	
}

const createStarving = colony => {
	const colonySprite = ColonyMapView.createSprite(colony)
	const good = createSprite(Goods.food.id)
	const minus = createIcon('minus')
	const exclamation = createIcon('exclamation')
	const container = combine(colonySprite, [good, minus], exclamation)

	const action = () => ColonyView.open(colony)
	const dismiss = {
		colonyScreen: c => c === colony
	}

	return {
		container,
		action,
		type: 'starving',
		dismiss
	}
}

const createDied = (colony, unit) => {
	const colonySprite = ColonyMapView.createSprite(colony)
	const unitView = UnitView.create(unit)
	const minus = createIcon('minus')
	const container = combine(colonySprite, unitView, minus)

	const action = () => ColonyView.open(colony)
	const dismiss = {
		colonyScreen: c => c === colony
	}

	return {
		container,
		action,
		type: 'died',
		dismiss
	}
}

const createStorageEmpty = (colony, good) => {
	const colonySprite = ColonyMapView.createSprite(colony)
	const goodView = createSprite(Goods[good].id)
	const minus = createIcon('minus')
	const container = combine(colonySprite, goodView, minus)

	const action = () => ColonyView.open(colony)
	const dismiss = {
		colonyScreen: c => c === colony
	}

	return {
		container,
		action,
		type: 'storageEmpty',
		dismiss
	}
}

const createStorageFull = (colony, good) => {
	const colonySprite = ColonyMapView.createSprite(colony)
	const goodView = createSprite(Goods[good].id)
	const exclamation = createIcon('exclamation')
	const container = combine(colonySprite, goodView, exclamation)

	const action = () => ColonyView.open(colony)
	const dismiss = {
		colonyScreen: c => c === colony
	}

	return {
		container,
		action,
		type: 'storageFull',
		dismiss
	}	
}

const remove = notification => {
	container.removeChild(notification.container)
	notifications = notifications.filter(n => n !== notification)
	notifications.forEach((n, i) => n.container.x = i*74)
}

const createType = {
	europe: params => createEurope(params.unit),
	america: params => createAmerica(params.unit),
	construction: params => createConstruction(params.colony),
	terraforming: params => createTerraforming(params.unit),
	rumor: params => createRumor(params.option, params.tile, params.unit),
	born: params => createSettlerBorn(params.colony, params.unit),
	starving: params => createStarving(params.colony),
	died: params => createDied(params.colony, params.unit),
	storageEmpty: params => createStorageEmpty(params.colony, params.good),
	storageFull: params => createStorageFull(params.colony, params.good)
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
	Foreground.get().notifications.addChild(container)

	RenderView.updateWhenResized(({ dimensions }) => {
		const scale = Math.min(dimensions.x / originalDimensions.x, dimensions.y / originalDimensions.y)

		container.x = dimensions.x / 2
		container.y = dimensions.y - 74
	})

	Events.listen('colonyScreen', colony => {
		const dismiss = notifications
			.filter(n => n.dismiss.colonyScreen)
			.filter(n => n.dismiss.colonyScreen(colony))

		dismiss.forEach(remove)
	})

	Events.listen('europeScreen', () => {
		const dismiss = notifications
			.filter(n => n.dismiss.europeScreen)
			.filter(n => n.dismiss.europeScreen())

		dismiss.forEach(remove)
	})
	Events.listen('select', unit => {
		const dismiss = notifications
			.filter(n => n.dismiss.select)
			.filter(n => n.dismiss.select(unit))

		dismiss.forEach(remove)
	})
	Events.listen('move', unit => {
		const dismiss = notifications
			.filter(n => n.dismiss.move)
			.filter(n => n.dismiss.move(unit))

		dismiss.forEach(remove)
	})
}

export default {
	create,
	initialize
}