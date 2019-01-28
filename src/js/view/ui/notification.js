import Terrain from 'data/terrain'
import Goods from 'data/goods'
import Buildings from 'data/buildings'
import Units from 'data/units'

import Tile from 'entity/tile'
import MapEntity from 'entity/map'
import Building from 'entity/building'
import Settlement from 'entity/settlement'
import Unit from 'entity/unit'
import Treasure from 'entity/treasure'

import Resources from 'render/resources'
import Foreground from 'render/foreground'
import RenderView from 'render/view'
import Background from 'render/background'
import Text from 'render/text'

import Util from 'util/util'
import Tween from 'util/tween'
import Record from 'util/record'

import Secondary from 'input/secondary'
import Click from 'input/click'

import UnitView from 'view/unit'
import EuropeView from 'view/europe'
import ColonyView from 'view/colony'

import MapView from 'view/map'
import UnitMapView from 'view/map/unit'
import ColonyMapView from 'view/map/colony'

import Dialog from 'view/ui/dialog'
import Events from 'view/ui/events'
import Icon from 'view/ui/icon'



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

	const text = Text.create(colony.name, {
		fontSize: 22,
	})
	text.position.x = colonySprite.x + terrainScale * (64 / 2)
	text.position.y = colonySprite.y + terrainScale * (64 / 2)
	text.anchor.set(0.5)
	text.scale.set(0.5)
	text.mask = mask

	return [...tileSprites, colonySprite, text, mask]
}

const buildingIcon = (colony, building) => {
	if (building.name === 'fortifications') {
		return new PIXI.Container()
	}

	// TODO: fixme, this is unacceptable
	const rectangle = Building.rectangle(colony, building)
	if (!rectangle) {
		return new PIXI.Container()
	}

	const sprite = Resources.sprite('buildings', { rectangle })
	if (rectangle.width === 128) {	
		sprite.scale.set(0.75)
		sprite.x = -16
		sprite.y = -16
	}
	if (rectangle.width === 256) {
		sprite.scale.set(0.5)
		sprite.x = -16
	}

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
	const icon = Icon.create('europe')
	const unitView = UnitView.create(unit)
	const arrow = Icon.create('right')
	const container = combine(icon, unitView, arrow)


	const action = () => EuropeView.open()

	const dismiss = {
		europeScreen: () => true
	}

	const dialog = {
		text: `A ${UnitView.getName(unit)} has arrived in Europe.`,
		type: 'naval'
	}

	return {
		container,
		action,
		type: 'europe',
		dismiss,
		dialog
	}
}

const createImmigration = unit => {
	const icon = Icon.create('europe')
	const unitView = UnitView.create(unit)
	const arrow = Icon.create('plus')
	const container = combine(icon, unitView, arrow)


	const action = () => EuropeView.open()

	const dismiss = {
		europeScreen: () => true
	}

	const dialog = {
		text: `Religous unrest has caused immigration from Europe. A new ${UnitView.getName(unit)} is waiting to be picked up in London.`,
		type: 'religion'
	}

	return {
		container,
		action,
		type: 'immigration',
		dismiss,
		dialog
	}	
}

const createAmerica = unit => {
	const icon = Icon.create('america')
	const unitView = UnitView.create(unit)
	const arrow = Icon.create('left')
	const container = combine(icon, unitView, arrow)

	const action = () => {
		MapView.centerAt(unit.mapCoordinates, 350)
		UnitMapView.select(unit)
	}

	const dismiss = {
		select: u => u === unit
	}

	const dialog = {
		text: `A ${UnitView.getName(unit)} has arrived in the new world.`,
		coords: unit.mapCoordinates,
		type: 'naval'
	}

	return {
		container,
		action,
		type: 'america',
		dismiss,
		dialog
	}
}

const createConstruction = (colony, { building, unit }) => {
	const colonyView = colonyIcon(colony)
	const targetView = building ? buildingIcon(colony, building) : UnitView.create(unit)
	const icon = Icon.create('plus')
	const container = combine(colonyView, targetView, icon)

	const action = () => ColonyView.open(colony)

	const dismiss = {
		colonyScreen: c => c === colony
	}

	const constructionName = building ? Building.getName(colony, building) : UnitView.getName(unit)
	const dialog = {
		text: `${colony.name} has finished the construction of a ${constructionName}.`,
		coords: colony.mapCoordinates,
		type: 'govenor'
	}

	return {
		container,
		action,
		type: 'america',
		dismiss,
		dialog
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

	const dialog = {
		text: `A ${UnitView.getName(unit)} has finished working on a tile`,
		coords: unit.mapCoordinates,
		type: 'scout'	
	}

	return {
		container,
		action,
		type: 'terraforming',
		dismiss,
		dialog
	}
}

const createRumor = (option, tile, unit) => {
	const rumors = Resources.sprite('map', { frame: Terrain.rumors.id - 1 })
	const icon = Icon.create('question')

	const container = combine(rumors, icon)

	const action = () => {
		UnitMapView.select(unit)
		Tile.updateRumors(tile)
		Dialog.create({
			type: 'scout',
			text: option.text,
			options: [{
				action: () => {
					option.action()
				},
				default: true
			}],
			coords: unit.mapCoordinates,
			pause: true
		})
	}

	const dismiss = {
		move: u => u === unit
	}

	const dialog = {
		text: `A ${UnitView.getName(unit)} has found a rumor.`,
		coord: unit.mapCoordinates,
		type: 'scout'
	}

	return {
		container,
		action,
		type: 'rumor',
		dismiss,
		dialog
	}
}

const createSettlementDialog = (settlement, unit, answer) => {
	const dialog = {
		pause: true,
		coords: unit.mapCoordinates,
		...Settlement.dialog(settlement, unit, answer)
	}
	dialog.options = dialog.options ? dialog.options.map(option => ({
		...option,
		action: () => {
			if (option.action) {
				option.action()
			}
			if (option.answer) {
				createSettlementDialog(settlement, unit, option.answer)
			}
		}
	})) : []

	Dialog.create(dialog)
}

const createSettlement = (settlement, unit) => {
	const MAP_SETTLEMENT_FRAME_ID = 59
	const settlementView = Resources.sprite('map', { frame: MAP_SETTLEMENT_FRAME_ID })
	const icon = Icon.create('question')

	const container = combine(settlementView, icon)

	const action = () => {
		createSettlementDialog(settlement, unit, 'enter')
	}

	const dismiss = {
		move: u => u === unit
	}

	const dialog = {
		text: `A ${UnitView.getName(unit)} has entered a native village`,
		coords: settlement.mapCoordinates,
		type: 'scout'
	}

	return {
		container,
		action,
		type: 'settlement',
		dismiss,
		dialog
	}
}

const createSettlerBorn = (colony, unit) => {
	const colonyView = colonyIcon(colony)
	const unitView = UnitView.create(unit)
	const plus = Icon.create('plus')
	const container = combine(colonyView, unitView, plus)

	const action = () => ColonyView.open(colony)
	const dismiss = {
		colonyScreen: c => c === colony
	}

	const dialog = {
		text: `A new settler has been born in ${colony.name}`,
		coords: colony.mapCoordinates,
		type: 'govenor'
	}

	return {
		container,
		action,
		type: 'born',
		dismiss,
		dialog
	}	
}

const createStarving = colony => {
	const colonyView = colonyIcon(colony)
	const good = Resources.sprite('map', { frame: Goods.food.id })
	const minus = Icon.create('minus')
	const exclamation = Icon.create('exclamation')
	const container = combine(colonyView, [good, minus], exclamation)

	const action = () => ColonyView.open(colony)
	const dismiss = {
		colonyScreen: c => c === colony
	}

	const dialog = {
		text: `The food storage of ${colony.name} is empty and the settlers are starving! Make sure they have enough food to support themselves immediatly.`,
		coord: colony.mapCoordinates,
		type: 'govenor'
	}

	return {
		container,
		action,
		type: 'starving',
		dismiss,
		dialog
	}
}

const createDied = (colony, unit) => {
	const colonyView = colonyIcon(colony)
	const unitView = UnitView.create(unit)
	const minus = Icon.create('minus')
	const container = combine(colonyView, unitView, minus)

	const action = () => ColonyView.open(colony)
	const dismiss = {
		colonyScreen: c => c === colony
	}

	const dialog = {
		text: `A ${UnitView.getName(unit)} has died of starvation in ${colony.name}`,
		coords: colony.mapCoordinates,
		type: 'govenor'
	}

	return {
		container,
		action,
		type: 'died',
		dismiss,
		dialog
	}
}

const createStorageEmpty = (colony, good) => {
	const colonyView = colonyIcon(colony)
	const goodView = Resources.sprite('map', { frame: Goods[good].id })
	const minus = Icon.create('minus')
	const container = combine(colonyView, goodView, minus)

	const action = () => ColonyView.open(colony)
	const dismiss = {
		colonyScreen: c => c === colony,
		unloadGood: (c, g) => c === colony && g === good
	}

	const dialog = {
		text: `${colony.name} has run out of ${good}.`,
		coords: colony.mapCoordinates,
		type: 'govenor'		
	}

	return {
		container,
		action,
		type: 'storageEmpty',
		dismiss,
		dialog
	}
}

const createStorageFull = (colony, good) => {
	const colonyView = colonyIcon(colony)
	const goodView = Resources.sprite('map', { frame: Goods[good].id })
	const exclamation = Icon.create('exclamation')
	const container = combine(colonyView, goodView, exclamation)

	const action = () => ColonyView.open(colony)
	const dismiss = {
		colonyScreen: c => c === colony,
		loadGood: (c, g) => c === colony && g === good
	}

	const dialog = {
		text: `The storage of ${colony.name} is full! Adding more goods will lead to loss.`,
		coords: colony.mapCoordinates,
		type: 'govenor'
	}

	return {
		container,
		action,
		type: 'storageFull',
		dismiss,
	}	
}

const createArrive = (colony, unit) => {
	const colonySprite = colonyIcon(colony)
	const unitView = UnitView.create(unit)
	const icon = Icon.create('left')
	const container = combine(colonySprite, unitView, icon)

	const action = () => ColonyView.open(colony)
	const dismiss = {
		colonyScreen: c => c === colony
	}

	const dialog = {
		text: `A ${UnitView.getName(unit)} has arrived in ${colony.name}`,
		coords: colony.mapCoordinates,
		type: 'naval'
	}

	return {
		container,
		action,
		type: 'arrive',
		dismiss,
		dialog
	}	
}

const createLearned = ({ colony, colonist, unit }) => {
	const colonySprite = colony ? colonyIcon(colony) : null
	unit = unit || colonist.unit
	const unitView = UnitView.create(unit)
	const book = Resources.sprite('map', { frame: Goods.books.id })

	const container = colony ? combine(colonySprite, unitView, book) : combine(unitView, book)

	const action = () => colony ? ColonyView.open(colony) : UnitMapView.select(unit)
	const dismiss = {
		colonyScreen: c => colony && c === colony,
		select: u => unit && u === unit
	}

	const dialog = {
		text: `A colonist has learned a new profession and is now considered a ${UnitView.getName(unit)}.`,
		coords: unit.mapCoordinates,
		type: 'govenor'
	}

	return {
		container,
		action,
		type: 'learned',
		dismiss,
		dialog
	}
}

const createTreasure = (colony, unit) => {
	const treasureView = UnitView.create(unit)
	const galleonView = Resources.sprite('map', { frame: Units.galleon.frame.default })
	const icon = Icon.create('right')
	const container = combine(treasureView, galleonView, icon)

	const action = () => {
		const hasGalleon = Record.getAll('unit')
			.filter(unit => unit.owner.input)
			.some(unit => unit.name === 'galleon')
		
		if (hasGalleon) {
			MapView.centerAt(unit.mapCoordinates, 350)
			UnitMapView.select(unit)
		} else {
			Dialog.create({
				type: 'king',
				text: 'You do not seem to have a galleon ready for transport. Would you like us to take care of the transport? The crown would, of course, take a fair share for its efforts.',
				coords: unit.mapCoordinates,
				options: [{
					text: 'Yes, please transport the treasure for us and take your share.',
					action: () => {
						const amount = Math.ceil(0.5 * unit.treasure)
						Unit.disband(unit)
						Treasure.gain(amount)
					}
				}, {
					text: 'No thank you, we will transport our valuables ourself.'
				}]
			})
		}
	}

	const dismiss = {}

	const dialog = {
		text: 'We have secured the treasure in on of our colonies. However, we need a galleon to transport it to Europe.',
		type: 'govenor',
		coords: unit.mapCoordinates
	}

	return {
		container,
		action,
		type: 'treasure',
		dismiss,
		dialog,
	}
}

const remove = notification => {
	notificationsContainer.removeChild(notification.container)
	notifications = notifications.filter(n => n !== notification)
	notifications.forEach((n, i) => n.container.x = i*74)
}

const createType = {
	europe: params => createEurope(params.unit),
	immigration: params => createImmigration(params.unit),
	america: params => createAmerica(params.unit),
	construction: params => createConstruction(params.colony, params),
	terraforming: params => createTerraforming(params.unit),
	rumor: params => createRumor(params.option, params.tile, params.unit),
	born: params => createSettlerBorn(params.colony, params.unit),
	starving: params => createStarving(params.colony),
	died: params => createDied(params.colony, params.unit),
	storageEmpty: params => createStorageEmpty(params.colony, params.good),
	storageFull: params => createStorageFull(params.colony, params.good),
	arrive: params => createArrive(params.colony, params.unit),
	settlement: params => createSettlement(params.settlement, params.unit),
	learned: params => createLearned(params),
	treasure: params => createTreasure(params.colony, params.unit)
}
const create = params => {
	const notification = createType[params.type](params)

	// TODO: Move this down to initialization. This is only here for save game compatibility
	if (!Record.getGlobal('notificationSeen')) {
		Record.setGlobal('notificationSeen', {})
	}
	if (Record.getGlobal('notificationSeen')[params.type]) {
		notification.container.x += notifications.length * 74
		Click.on(notification.container, () => {
			notification.action()
			remove(notification)
		})
		Secondary.on(notification.container, () => remove(notification))
	} else {
		Dialog.create({
			type: 'notification',
			pause: true,
			...notification.dialog,
			options: [{
				default: true,
				text: 'Ok, thank you.',
				action: () => {
					unsubscribePositioning()
					Tween.scaleTo(notification.container, 1, 1500)
					Tween.moveTo(notification.container, { x: (notifications.length-1) * 74, y: 0 }, 1500)
					Click.on(notification.container, () => {
							notification.action()
							remove(notification)
						})
						Secondary.on(notification.container, () => remove(notification))
				}
			}]
		})

		notification.container.scale.set(2)
		const unsubscribePositioning = RenderView.listen.dimensions(dimensions => {
			notification.container.x = - 64
			notification.container.y = - -64 - dimensions.y / 2
		})
	}

	notificationsContainer.addChild(notification.container)
	notifications.push(notification)
	Record.getGlobal('notificationSeen')[params.type] = true
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
	Events.listen('loadGood', ({ colony, good }) => {
		const dismiss = notifications
			.filter(n => n.dismiss.loadGood)
			.filter(n => n.dismiss.loadGood(colony, good))

		dismiss.forEach(remove)
	})
	Events.listen('unloadGood', ({ colony, good }) => {
		const dismiss = notifications
			.filter(n => n.dismiss.unloadGood)
			.filter(n => n.dismiss.unloadGood(colony, good))

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