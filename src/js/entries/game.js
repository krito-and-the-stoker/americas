import * as Sentry from '@sentry/browser'

import Version from 'version/version'

import americaLargeMap from 'maps/america-large'
import Terrain from 'data/terrain'

import Tween from 'util/tween.js'
import PathFinder from 'util/pathFinder'
import Record from 'util/record'
import Util from 'util/util'
import Message from 'util/message'

import Time from 'timeline/time'

import MapEntity from 'entity/map.js'
import Unit from 'entity/unit'
import Europe from 'entity/europe'
import Market from 'entity/market'
import Tribe from 'entity/tribe'
import Owner from 'entity/owner'

import Meet from 'task/meet'

import Input from 'input'

import Resources from 'render/resources'
import RenderMap from 'render/map.js'
import RenderView from 'render/view.js'
import Foreground from 'render/foreground'
import Background from 'render/background'

import MapView from 'view/map'
import AutosaveView from 'view/autosave'
import FullscreenEvents from 'view/fullscreenEvents'
import Tutorial from 'view/tutorial'

import Dialog from 'view/ui/dialog'

import GlobalPanel from 'view/panel/global'


const captureException = err => {
	if (process.env.SENTRY_DSN) {
		Sentry.captureException(err)
	}
	throw err
}

if (process.env.SENTRY_DSN) {
	Sentry.init({
		dsn: process.env.SENTRY_DSN,
		release: Version.revision
	})
}

const AUTOSAVE_INTERVAL = 60000
const initialize = () => {
	let timeStamp = 0
	setInterval(Record.autosave, AUTOSAVE_INTERVAL)

	Time.schedule(Meet.create())
	Time.schedule(Background.opacityTask())

	const loop = t => {
		const deltaTime = Math.min(t - timeStamp, 150)
		timeStamp = t
		try {		
			Time.advance(deltaTime)
			RenderView.onDraw()
		} catch (err) {
			captureException(err)
		}
		requestAnimationFrame(loop)
	}

	requestAnimationFrame(t => {
		timeStamp = t
		requestAnimationFrame(loop)
	})
}

// const americaSmall = () => {
// 	const startCoordinates = Util.choose([
// 		{ x: 135, y: 82 },
// 		{ x: 152, y: 105 },
// 		{ x: 168, y: 117 },
// 		{ x: 159, y: 152 },
// 		{ x: 132, y: 55 }])
// 	const pioneer = Unit.create('pioneer', startCoordinates, Owner.player())
// 	const soldier = Unit.create('soldier', startCoordinates, Owner.player())
// 	const caravel = Unit.create('caravel', startCoordinates, Owner.player())
// 	Unit.loadUnit(caravel, pioneer)
// 	Unit.loadUnit(caravel, soldier)
// 	MapView.centerAt(startCoordinates, 0, {
// 		x: 0.3,
// 		y: 0.5
// 	})
// 	UnitMapView
// 	Record.setGlobal('defaultShipArrival', startCoordinates)

// 	return caravel
// }

const americaLarge = () => {
	const startCoordinates = Util.choose(
		MapEntity.get().tiles.filter(tile =>
			tile.zone === Terrain.start.id)).mapCoordinates

	const pioneer = Unit.create('pioneer', startCoordinates, Owner.player())
	const soldier = Unit.create('soldier', startCoordinates, Owner.player())
	const caravel = Unit.create('caravel', startCoordinates, Owner.player())
	Unit.loadUnit(caravel, pioneer)
	Unit.loadUnit(caravel, soldier)
	MapView.centerAt(startCoordinates, 0, {
		x: 0.5,
		y: 0.5
	})
	MapView.zoomBy(1/0.35, null, 0)
	Record.setGlobal('defaultShipArrival', startCoordinates)

	return caravel
}

const nextFrame = () => new Promise(resolve => requestAnimationFrame(resolve))

let loadingResources = null
const preload = () => {
	Message.log(`Downloading files (2/${Resources.numberOfAssets()})...`)
	loadingResources = Resources.initialize()
}

const start = async () => {
	try {
		if (!loadingResources) {
			preload()
		}

		await loadingResources
		await nextFrame()

		Owner.initialize()

		// MapEntity.create({ data: americaSmallMap })
		MapEntity.create({ data: americaLargeMap })

		await nextFrame()

		new RenderMap()

		await nextFrame()

		RenderView.initialize()

		await nextFrame()
		MapView.initialize()
		await nextFrame()
		Tween.initialize()
		await nextFrame()
		PathFinder.initialize()
		await nextFrame()

		Europe.initialize()
		Market.initialize()
		await nextFrame()
		Tribe.createFromMap(MapEntity.get())
		await nextFrame()

		AutosaveView.initialize()
		GlobalPanel.initialize(Foreground.get().permanent)
		Dialog.initialize()

		// start game!
		// const caravel = americaSmall()
		const caravel = americaLarge()

		await nextFrame()
		MapView.zoomBy(1/0.35, null, 0)
		MapView.zoomBy(1/0.35, null, 100)
		setTimeout(async () => {
			Message.log('Starting game...')
			MapView.zoomBy(0.35, null, 3000)
		}, 100)

		setTimeout(() => {
			Background.get().layer.show()
			Foreground.get().layer.show()		
		}, 750)

		setTimeout(() => {
			Input.initialize()
			Dialog.create({
				type: 'naval',
				text: 'Sir,\nWe crossed the atlantic ocean. The new world called America lies ahead. Let us sail west and claim Englands fair share of this land!',
				coords: caravel.mapCoordinates,
				pause: true
			})
		}, 3500)

		FullscreenEvents.initialize()
		Tutorial.initialize()

		await nextFrame()
		initialize()
	} catch (err) {
		captureException(err)
		Dialog.create({
			type: 'menu',
			text: 'There has been an error initializing the game. A report has been sent and we will investigate and fix it shortly.'
		})
	}
}

const load = async () => {
	try {
		if (!loadingResources) {
			preload()
		}

		await loadingResources
		await nextFrame()

		RenderView.initialize()
		await nextFrame()
		Tween.initialize()
		MapView.initialize()
		await nextFrame()

		// for no apparent reason the layers are not available inside TreasureView
		Europe.initialize()
		await nextFrame()
		GlobalPanel.initialize(Foreground.get().permanent)
		Message.log('Restoring game state...')
		await nextFrame()
		Record.load()
		await nextFrame()
		AutosaveView.initialize()
		Dialog.initialize()

		MapView.zoomBy(1/0.35, null, 0)
		setTimeout(() => {
			Message.log('Starting game...')
			MapView.zoomBy(0.35, null, 3000)
		}, 100)

		setTimeout(() => {
			Background.get().layer.show()
			Foreground.get().layer.show()		
		}, 750)

		setTimeout(() => {
			Input.initialize()
		}, 3000)

		FullscreenEvents.initialize()
		Tutorial.initialize()

		initialize()
	} catch (err) {
		captureException(err)
		if (Record.getGlobal('revision') !== Version.revision) {		
			Dialog.create({
				type: 'menu',
				text: 'There has been an error loading the save game. The save game is from an earlier release and this is most likely the reason.'
			})
		} else {
			Dialog.create({
				type: 'menu',
				text: 'There has been an error initializing the game. A report has been sent and we will investigate and fix it shortly.'
			})
		}
	}
}

const save = Record.save

export default {
	start,
	load,
	save,
	preload
}