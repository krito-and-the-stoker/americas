import Icons from '../../data/icons.json'
import Terrain from '../../data/terrain.json'
import Goods from '../../data/goods.json'
import Buildings from '../../data/buildings.json'

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
import Tile from '../../entity/tile'
import Building from '../../entity/building'


const originalDimensions = {
	x: 1920,
	y: 1080
}
let notificationsContainer = null
let notifications = []

const createTileView = tile => {
	const tileSprites = Background.createSpritesFromTile(tile)
	return tileSprites
}
const createCircleMask = () => {
	const circle = new PIXI.Graphics()
	circle.beginFill(0xFFFFFF)
	circle.drawCircle(32, 32, 26)
	circle.endFill()
	return circle	
}
const createSprite = frame => new PIXI.Sprite(new PIXI.Texture(Ressources.get().mapTiles, Util.rectangle(frame)))
const createIcon = name => createSprite(Icons[name])
const colonyIcon = colony => {
	const terrainScale = 0.33
	const center = MapEntity.tile(colony.mapCoordinates)
	const mask = createCircleMask()
	const tileSprites = Tile.radius(center)
		.map(tile => {
			const sprites = createTileView(tile)
			sprites.forEach(sprite => {			
				sprite.x = terrainScale * 64 * (tile.mapCoordinates.x - center.mapCoordinates.x + 1)
				sprite.y = terrainScale * 64 * (tile.mapCoordinates.y - center.mapCoordinates.y + 1)
				sprite.scale.set(terrainScale)
				sprite.mask = mask
			})
			return sprites
		}).flat()
	const colonySprite = ColonyMapView.createSprite(colony)
	colonySprite.x = terrainScale * 64
	colonySprite.y = terrainScale * 64
	colonySprite.scale.set(terrainScale)

	const text = new PIXI.Text(colony.name, {
		fontFamily: 'Times New Roman',
		fontSize: 22,
		fill: 0xffffff,
		align: 'center'
	})
	// text.position.x = colonySprite.x + terrainScale * (64 / 2)
	// text.position.y = colonySprite.y + terrainScale * (64 - 5)
	text.position.x = colonySprite.x + terrainScale * (64 / 2)
	text.position.y = colonySprite.y + terrainScale * (64 / 2)
	text.anchor.set(0.5)
	text.scale.set(0.5)
	text.mask = mask

	// const number = new PIXI.Text(`${colony.colonists.length}`, {
	// 	fontFamily: 'Times New Roman',
	// 	fontSize: 22,
	// 	fill: 0xffffff,
	// 	align: 'center'
	// })
	// number.position.x = colonySprite.x + terrainScale * (64 / 2)
	// number.position.y = colonySprite.y + terrainScale * (64 / 2)
	// number.scale.set(0.5)
	// number.anchor.set(0.5)

	return [...tileSprites, colonySprite, text, mask]
}

const buildingIcon = (colony, building) => {
	const frame = Building.frame(colony, building)
	const x = 128 * frame
	const y = 0
	const width = 128 * Buildings[building].width
	const height = 128
	const rectangle = new PIXI.Rectangle(x, y, width, height)
	const sprite = new PIXI.Sprite(new PIXI.Texture(Ressources.get().buildings, rectangle))
	if (width === 128) {	
		sprite.scale.set(0.75)
		sprite.x = -16
		sprite.y = -16
	}
	if (width === 256) {
		sprite.scale.set(0.5)
		sprite.x = -16
	}
	console.log(sprite)

	return sprite
}

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
		s.x += position.x
		s.y += position.y
		s.scale.set(s.scale.x * scale1)
		container.addChild(s)
	})

	const scale2 = 0.4
	position = {
		x: (1 - scale2 - 0.5*scale1) * 64,
		y: (1 - scale2) * 64
	}
	const slot3Sprites = slot3 ? (slot3.length ? slot3 : [slot3]) : []
	slot3Sprites.forEach(s => {
		s.x += position.x
		s.y += position.y
		s.scale.set(s.scale.x * scale2)
		container.addChild(s)
	})

	container.cacheAsBitmap = true

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

const createConstruction = (colony, { building, unit }) => {
	const colonyView = colonyIcon(colony)
	const targetView = building ? buildingIcon(colony, building) : UnitView.create(unit)
	const icon = createIcon('plus')
	const container = combine(colonyView, targetView, icon)

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
	const colonyView = colonyIcon(colony)
	const unitView = UnitView.create(unit)
	const plus = createIcon('plus')
	const container = combine(colonyView, unitView, plus)

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
	const colonyView = colonyIcon(colony)
	const good = createSprite(Goods.food.id)
	const minus = createIcon('minus')
	const exclamation = createIcon('exclamation')
	const container = combine(colonyView, [good, minus], exclamation)

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
	const colonyView = colonyIcon(colony)
	const unitView = UnitView.create(unit)
	const minus = createIcon('minus')
	const container = combine(colonyView, unitView, minus)

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
	const colonyView = colonyIcon(colony)
	const goodView = createSprite(Goods[good].id)
	const minus = createIcon('minus')
	const container = combine(colonyView, goodView, minus)

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
	const colonyView = colonyIcon(colony)
	const goodView = createSprite(Goods[good].id)
	const exclamation = createIcon('exclamation')
	const container = combine(colonyView, goodView, exclamation)

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

const createArrive = (colony, unit) => {
	const colonySprite = colonyIcon(colony)
	const unitView = UnitView.create(unit)
	const icon = createIcon('left')
	const container = combine(colonySprite, unitView, icon)

	const action = () => ColonyView.open(colony)
	const dismiss = {
		colonyScreen: c => c === colony
	}

	return {
		container,
		action,
		type: 'arrive',
		dismiss
	}	
}

const remove = notification => {
	notificationsContainer.removeChild(notification.container)
	notifications = notifications.filter(n => n !== notification)
	notifications.forEach((n, i) => n.container.x = i*74)
}

const createType = {
	europe: params => createEurope(params.unit),
	america: params => createAmerica(params.unit),
	construction: params => createConstruction(params.colony, params),
	terraforming: params => createTerraforming(params.unit),
	rumor: params => createRumor(params.option, params.tile, params.unit),
	born: params => createSettlerBorn(params.colony, params.unit),
	starving: params => createStarving(params.colony),
	died: params => createDied(params.colony, params.unit),
	storageEmpty: params => createStorageEmpty(params.colony, params.good),
	storageFull: params => createStorageFull(params.colony, params.good),
	arrive: params => createArrive(params.colony, params.unit)
}
const create = params => {
	const notification = createType[params.type](params)
	notification.container.x += notifications.length * 74

	notificationsContainer.addChild(notification.container)
	Click.on(notification.container, () => {
		notification.action()
		remove(notification)
	})
	Secondary.on(notification.container, () => remove(notification))
	notifications.push(notification)
}

const initialize = () => {
	notificationsContainer = new PIXI.Container()
	Foreground.get().notifications.addChild(notificationsContainer)

	RenderView.updateWhenResized(({ dimensions }) => {
		const scale = Math.min(dimensions.x / originalDimensions.x, dimensions.y / originalDimensions.y)

		notificationsContainer.x = dimensions.x / 2
		notificationsContainer.y = dimensions.y - 74
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
	Events.listen('notification', params => {
		create(params)
	})
}

export default {
	create,
	initialize
}