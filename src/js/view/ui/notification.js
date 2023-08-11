import * as PIXI from 'pixi.js'

import Terrain from 'data/terrain'
import Goods from 'data/goods'
import Units from 'data/units'
import Buildings from 'data/buildings'

import Util from 'util/util'

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
import Events from 'util/events'
import Icon from 'view/ui/icon'



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

const tileIcon = center => {
	const terrainScale = 0.33
	const mask = createCircleMask()
	return Tile.radius(center)
		.map(tile => {
			const sprites = createTileView(tile)
			sprites.forEach(sprite => {			
				sprite.x = terrainScale * 64 * (tile.mapCoordinates.x - center.mapCoordinates.x + 1)
				sprite.y = terrainScale * 64 * (tile.mapCoordinates.y - center.mapCoordinates.y + 1)
				sprite.scale.set(terrainScale)
				sprite.mask = mask
			})
			return sprites
		}).flat().concat([mask])
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

const frame = (colony, building) => Buildings[building.name].frame[colony.buildings[building.name].level] ? Buildings[building.name].frame[colony.buildings[building.name].level] - 1 : null
const buildingRectangle = (colony, building) => {
	if (frame(colony, building) === null) {
		return null
	}

	const fr = frame(colony, building)
	const cols = 13
	const x = 128 * (fr % cols)
	const y = 128 * Math.floor(fr / cols)
	const width = Buildings[building.name].width * 128
	const height = 128
	return new PIXI.Rectangle(x, y, width, height)	
}
const buildingIcon = (colony, building) => {
	if (building.name === 'fortifications') {
		return new PIXI.Container()
	}

	// TODO: fixme, this is unacceptable
	const rectangle = buildingRectangle(colony, building)
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

	container.scale.set(1.5)

	return container
}

const createEurope = unit => {
	const icon = Icon.create('europe')
	const unitView = Resources.sprite('map', { frame: UnitView.getFrame(unit) })
	const arrow = Icon.create('right')
	const container = combine(icon, unitView, arrow)


	const action = () => EuropeView.open()

	const dismiss = {
		europeScreen: () => true
	}

	const dialog = {
		text: `A ${Unit.name(unit)} has arrived in Europe.`,
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
	const unitView = Resources.sprite('map', { frame: UnitView.getFrame(unit) })
	const arrow = Icon.create('plus')
	const container = combine(icon, unitView, arrow)


	const action = () => EuropeView.open()

	const dismiss = {
		europeScreen: () => true
	}

	const dialog = {
		text: `Religous unrest has caused immigration from Europe. A new ${Unit.name(unit)} is waiting to be picked up in London.`,
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
	const unitView = Resources.sprite('map', { frame: UnitView.getFrame(unit) })
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
		text: `A ${Unit.name(unit)} has arrived in the new world.`,
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
	const targetView = building ? buildingIcon(colony, building) : Resources.sprite('map', { frame: UnitView.getFrame(unit) })
	const icon = Icon.create('plus')
	const container = combine(colonyView, targetView, icon)

	const action = () => ColonyView.open(colony)

	const dismiss = {
		colonyScreen: c => c === colony
	}

	const constructionName = building ? Building.getName(colony, building) : Unit.name(unit)
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
	const unitSprite = Resources.sprite('map', { frame: UnitView.getFrame(unit) })

	const container = combine(tileSprites.concat(circle), unitSprite)

	const action = () => {
		MapView.centerAt(unit.mapCoordinates, 350)
		UnitMapView.select(unit)
	}

	const dismiss = {
		select: u => u === unit
	}

	const dialog = {
		text: `A ${Unit.name(unit)} has finished working on a tile`,
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
		text: `A ${Unit.name(unit)} has found a rumor.`,
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
		move: u => u === unit,
		select: u => u === unit
	}

	const dialog = {
		text: `A ${Unit.name(unit)} has entered a native village`,
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
	const unitView = Resources.sprite('map', { frame: UnitView.getFrame(unit) })
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

const createDied = unit => {
	const unitView = Resources.sprite('map', { frame: UnitView.getFrame(unit) })
	const good = Resources.sprite('map', { frame: Goods.food.id })
	const minus = Icon.create('minus')
	const container = combine(unitView, good, minus)

	const action = () => MapView.centerAt(unit.mapCoordinates, 350)
	const dismiss = {}

	const dialog = {
		text: `A ${Unit.name(unit)} has died of starvation`,
		coords: unit.mapCoordinates,
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
		dialog
	}	
}

const createArrive = (colony, unit) => {
	const colonySprite = colonyIcon(colony)
	const unitView = Resources.sprite('map', { frame: UnitView.getFrame(unit) })
	const icon = Icon.create('left')
	const container = combine(colonySprite, unitView, icon)

	const action = () => ColonyView.open(colony)
	const dismiss = {
		colonyScreen: c => c === colony
	}

	const dialog = {
		text: `A ${Unit.name(unit)} has arrived in ${colony.name}`,
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
	const unitView = Resources.sprite('map', { frame: UnitView.getFrame(unit) })
	const book = Resources.sprite('map', { frame: Goods.books.id })

	const container = colony ? combine(colonySprite, unitView, book) : combine(unitView, book)

	const action = () => {
		if (colony) {
			ColonyView.open(colony)
		} else {
			MapView.centerAt(unit.mapCoordinates, 350)
			UnitMapView.select(unit)
		}
	}

	const dismiss = {
		colonyScreen: c => colony && c === colony,
		select: u => unit && u === unit
	}

	const dialog = {
		text: `A colonist has learned a new profession and is now considered a **${Unit.name(unit)}**.`,
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
	const treasureView = Resources.sprite('map', { frame: UnitView.getFrame(unit) })
	const galleonView = Resources.sprite('map', { frame: Units.galleon.frame.default })
	const icon = Icon.create('right')
	const container = combine(treasureView, galleonView, icon)

	const action = () => {
		const hasGalleon = Record.getAll('unit')
			.filter(unit => unit.owner.input)
			.some(unit => unit.name === 'galleon')
		
		MapView.centerAt(unit.mapCoordinates, 350)
		UnitMapView.select(unit)
		if (!hasGalleon) {
			Dialog.create({
				type: 'king',
				text: 'You do not seem to have **a galleon** ready for transport. Would you like us to *take care of the transport*? The crown would, of course, take a **fair share** for its efforts.<options/>',
				coords: unit.mapCoordinates,
				options: [{
					text: `Yes, please transport the treasure for us and take your share of 50% (${Math.round(0.5 * unit.treasure)}<good>gold</good>).`,
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
		text: `We have secured the treasure in *${colony.name}*. However, we need **a galleon** to transport it to Europe.`,
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

const createDestroyed = (settlement, treasure) => {
	const MAP_SETTLEMENT_FRAME_ID = 59
	const settlementView = Resources.sprite('map', { frame: MAP_SETTLEMENT_FRAME_ID })
	const icon = Icon.create('minus')
	const container = combine(settlementView, icon)

	const action = () => {
		MapView.centerAt(settlement.mapCoordinates, 350)
		UnitMapView.select(treasure)
	}

	const dismiss = {}

	const tribeName = settlement.tribe.name
	const dialog = {
		text: `A settlement of the *${tribeName}* has been **destroyed**. Natives flee in panic. The *${tribeName}* swear to take revenge. We have found **${treasure.treasure}**<good>gold</good> in the ruins.`,
		type: 'marshal',
		coords: settlement.mapCoordinates
	}

	return {
		container,
		action,
		type: 'destroyed',
		dismiss,
		dialog
	}
}

const createDecimated = settlement => {
	const MAP_SETTLEMENT_FRAME_ID = 59
	const settlementView = Resources.sprite('map', { frame: MAP_SETTLEMENT_FRAME_ID })
	const unitView = Resources.sprite('map', { frame: Units.native.frame.default })
	const icon = Icon.create('minus')
	const container = combine(settlementView, unitView, icon)

	const action = () => {
		MapView.centerAt(settlement.mapCoordinates, 350)
	}

	const dismiss = {}

	const tribeName = settlement.tribe.name
	const dialog = {
		text: `A settlement of the *${tribeName}* has been decimated tremendously.`,
		type: 'marshal',
		coords: settlement.mapCoordinates
	}

	return {
		container,
		action,
		type: 'destroyed',
		dismiss,
		dialog
	}
}

const createRaid = (colony, unit, pack) => {
	const colonyView = colonyIcon(colony)
	const unitView = Resources.sprite('map', { frame: UnitView.getFrame(unit) })
	const icon = Icon.create('minus')

	const container = combine(colonyView, unitView, icon)

	const action = () => {
		MapView.centerAt(colony.mapCoordinates, 350)
		Dialog.create({
			type: 'govenor',
			text: `The storage of *${colony.name}* has been *plundered*. **${Math.round(pack.amount)}**<good>${pack.good}</good> are missing.`,
			coords: colony.mapCoordinates
		})
	}

	const dismiss = {}

	const dialog = {
		text: `There has been *a raid* in *${colony.name}*. The storage has been plundered and lots of goods are missing. Try protect your cities with *armed forces*. *Stockades and forts* are greatly effective to prevent such events.`,
		type: 'govenor',
		coords: colony.mapCoordinates
	}

	return {
		container,
		action,
		type: 'raid',
		dismiss,
		dialog
	}
}

const createCombat = (attacker, defender, loser, strength) => {
	const coords = {
		x: Math.round((attacker.mapCoordinates.x + defender.mapCoordinates.x) / 2),
		y: Math.round((attacker.mapCoordinates.y + defender.mapCoordinates.y) / 2)
	}
	const tile = MapEntity.tile(coords)
	const tileView = tileIcon(tile)
	const attackerView = UnitView.create(attacker)
	const defenderView = UnitView.create(defender)
	const combatIcon = Icon.create('combat')
	const xIcon = Icon.create('cancel')
	Util.execute([
		attackerView.unsubscribe,
		defenderView.unsubscribe,
	])

	const container = new PIXI.Container()

	tileView.forEach(tile => container.addChild(tile))
	
	attackerView.sprite.scale.set(0.5)
	attackerView.sprite.x = 0
	attackerView.sprite.y = 32
	container.addChild(attackerView.sprite)
	
	defenderView.sprite.scale.set(0.5)
	defenderView.sprite.x = 32
	defenderView.sprite.y = 32
	container.addChild(defenderView.sprite)

	combatIcon.scale.set(0.25)
	combatIcon.x = 24
	combatIcon.y = 40
	container.addChild(combatIcon)

	xIcon.scale.set(0.5)
	xIcon.x = loser === attacker ? attackerView.sprite.x : defenderView.sprite.x
	xIcon.y = 32
	container.addChild(xIcon)

	container.scale.set(1.5)

	const winner = attacker === loser ? defender : attacker
	const winnerStrength = Math.round(10 * (attacker === winner ? strength.attacker : strength.defender)) / 10
	const loserStrength = Math.round(10 * (attacker === loser ? strength.attacker : strength.defender)) / 10

	const action = () => {
		MapView.centerAt(coords, 350)
		Dialog.create({
			type: 'marshal',
			text: `A **${Unit.name(winner)}** (${winnerStrength}) has defeated a **${Unit.name(loser)}** (${loserStrength}) in battle.`,
		})
	}

	const dismiss = {}

	const dialog = {
		type: 'marshal',
		text: 'There has been a fight!',
		coords: defender.mapCoordinates
	}

	return {
		container,
		action,
		type: 'combat',
		dismiss,
		dialog
	}
}

const remove = notification => {
	Tween.fadeOut(notification.container, 500).then(() => {	
		notificationsContainer.removeChild(notification.container)
		notifications = notifications.filter(n => n !== notification)
		notifications.forEach((n, i) => n.container.x = i*74)
	})
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
	died: params => createDied(params.unit),
	storageEmpty: params => createStorageEmpty(params.colony, params.good),
	storageFull: params => createStorageFull(params.colony, params.good),
	arrive: params => createArrive(params.colony, params.unit),
	settlement: params => createSettlement(params.settlement, params.unit),
	learned: params => createLearned(params),
	treasure: params => createTreasure(params.colony, params.unit),
	combat: params => createCombat(params.attacker, params.defender, params.loser, params.strength),
	raid: params => createRaid(params.colony, params.unit, params.pack),
	destroyed: params => createDestroyed(params.settlement, params.treasure),
	decimated: params => createDecimated(params.settlement)
}

const iconSize = 1.5*64
const iconMargin = 10
const create = params => {
	const notification = createType[params.type](params)

	if (Record.getGlobal('notificationSeen')[params.type]) {
		notification.container.x += notifications.length * (iconSize + iconMargin)
		Tween.fadeIn(notification.container, 500).then(() => {
			notification.container.cacheAsBitmap = true
		})
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
				action: () => {
					unsubscribePositioning()
					notification.container.cacheAsBitmap = true
					Tween.scaleTo(notification.container, 1.5, 1500)
					Tween.moveTo(notification.container, { x: (notifications.length-1) * (iconSize + iconMargin), y: 0 }, 1500)
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
			notification.container.x = - iconSize
			notification.container.y = - iconSize - dimensions.y / 2
		})
	}

	notificationsContainer.addChild(notification.container)
	notifications.push(notification)
	Record.getGlobal('notificationSeen')[params.type] = true
}

const initialize = () => {
	if (!Record.getGlobal('notificationSeen')) {
		Record.setGlobal('notificationSeen', {})
	}

	notificationsContainer = new PIXI.Container()
	Foreground.get().notifications.addChild(notificationsContainer)

	RenderView.updateWhenResized(({ dimensions }) => {
		notificationsContainer.x = dimensions.x / 2
		notificationsContainer.y = dimensions.y - (iconSize + iconMargin)
	})

	Events.listen('openScreen', ({ name, colony }) => {
		if (name === 'europe') {
			const dismiss = notifications
				.filter(n => n.dismiss.europeScreen)
				.filter(n => n.dismiss.europeScreen())

			dismiss.forEach(remove)
		}
		if (name === 'colony') {		
			const dismiss = notifications
				.filter(n => n.dismiss.colonyScreen)
				.filter(n => n.dismiss.colonyScreen(colony))

			dismiss.forEach(remove)
		}
	})
	Events.listen('closeScreen', ({ name, colony }) => {
		if (name === 'europe') {
			const dismiss = notifications
				.filter(n => n.dismiss.europeScreen)
				.filter(n => n.dismiss.europeScreen())

			dismiss.forEach(remove)
		}
		if (name === 'colony') {		
			const dismiss = notifications
				.filter(n => n.dismiss.colonyScreen)
				.filter(n => n.dismiss.colonyScreen(colony))

			dismiss.forEach(remove)
		}
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
	Events.listen('select', unit => {
		if (Unit.isIdle(unit) && unit.tile.settlement) {
			Events.trigger('notification', { type: 'settlement', settlement: unit.tile.settlement, unit })
		}
	})
}

export default {
	create,
	initialize
}