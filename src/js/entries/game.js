import MainLoop from 'mainloop.js'

import MapEntity from '../entity/map.js'
import RenderMap from '../render/map.js'
import RenderView from '../render/view.js'
import Keyboard from '../input/keyboard.js'
import americaSmallMap from '../data/america-small.json'
import americaLargeMap from '../data/america-large.json'
import Tween from '../util/tween.js'
import Unit from '../entity/unit'
import Ressources from '../render/ressources'
import Europe from '../entity/europe'
import Market from '../entity/market'
import Time from '../timeline/time'
import PathFinder from '../util/pathFinder'
import MapView from '../view/map'
import Dialog from '../view/ui/dialog'
import TreasureView from '../view/treasure'
import YearView from '../view/year'
import Foreground from '../render/foreground'
import Background from '../render/background'
import Record from '../util/record'
import Util from '../util/util'
import Tribe from '../entity/tribe'
import Message from '../view/ui/message'
import NumberOfAssets from '../data/numberOfAssets.json'
import * as Sentry from '@sentry/browser'


const captureException = err => {
	if (process.env.SENTRY_DSN) {
		Sentry.captureException(err)
		return
	}
	throw err
}

if (process.env.SENTRY_DSN) {
	Sentry.init({ dsn: 'https://5af48842d6d643d3bde7a59f2fe81b42@sentry.io/1198155' })
}

const update = deltaTime => {
	try {
		Time.advance(deltaTime)
	} catch (err) {
		captureException(err)
	}
}

const draw = () => {
	try {
		RenderView.onDraw()
	} catch (err) {
		captureException(err)
	}
}

const americaSmall = () => {
	const startCoordinates = Util.choose([
	{ x: 135, y: 82 },
	{ x: 152, y: 105 },
	{ x: 168, y: 117 },
	{ x: 159, y: 152 },
	{ x: 132, y: 55 }])
	const pioneer = Unit.create('pioneer', startCoordinates)
	const soldier = Unit.create('soldier', startCoordinates)
	const caravel = Unit.create('caravel', startCoordinates)
	Unit.loadUnit(caravel, pioneer)
	Unit.loadUnit(caravel, soldier)
	MapView.centerAt(startCoordinates)
	Record.setGlobal('defaultShipArrival', startCoordinates)
}

const americaLarge = () => {
	const startCoordinates = Util.choose([
	{ x: 172, y: 113 },
	{ x: 182, y: 102 },
	{ x: 167, y: 141 },
	{ x: 171, y: 160 },
	{ x: 181, y: 168 },
	{ x: 200, y: 180 },
	{ x: 231, y: 206 },
	{ x: 286, y: 243 },
	{ x: 275, y: 296 },
	{ x: 235, y: 354 }])
	const pioneer = Unit.create('pioneer', startCoordinates)
	const soldier = Unit.create('soldier', startCoordinates)
	const caravel = Unit.create('caravel', startCoordinates)
	Unit.loadUnit(caravel, pioneer)
	Unit.loadUnit(caravel, soldier)
	MapView.centerAt(startCoordinates)
	MapView.zoomBy(1/0.35, null, 0)
	Record.setGlobal('defaultShipArrival', startCoordinates)
}

const nextFrame = () => new Promise(resolve => requestAnimationFrame(resolve))

let loadingRessources = null
const preload = () => {
	Message.log(`Downloading files (2/${NumberOfAssets.files})...`)
	loadingRessources = Ressources.initialize()
}

const start = async () => {
	if (!loadingRessources) {
		preload()
	}

	await loadingRessources
	await nextFrame()

	MapEntity.create({ data: americaSmallMap })
	// MapEntity.create({ data: americaLargeMap })

	await nextFrame()

	const mapRendering = new RenderMap()

	await nextFrame()

	RenderView.initialize()

	await nextFrame()
	MapView.initialize()
	await nextFrame()
	Dialog.initialize()
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

	// for no apparent reason the layers are not available inside TreasureView
	TreasureView.initialize(Foreground.get().permanent)
	await nextFrame()
	YearView.initialize(Foreground.get().permanent)

	// start game!
	americaSmall()
	// americaLarge()

	await nextFrame()
	MapView.zoomBy(1/0.35, null, 0)
	MapView.zoomBy(1/0.35, null, 100)
	setTimeout(async () => {
		Message.log('Starting game...')
		await Dialog.welcome()
		MapView.zoomBy(0.35, null, 3000)
	}, 100)

	setTimeout(() => {
		Background.get().layer.show()
		Foreground.get().layer.show()		
	}, 750)

	setTimeout(() => {
		Keyboard.initialize()
	}, 3000)

	await nextFrame()
	document.addEventListener('visibilitychange', () => {
		if (document.hidden) {
			MainLoop.stop()
		} else {
			MainLoop.start()
		}
	})

	await nextFrame()
	MainLoop.setUpdate(update)
	MainLoop.setDraw(draw)
	MainLoop.start()
}

const load = async () => {
	if (!loadingRessources) {
		preload()
	}

	await loadingRessources
	await nextFrame()

	RenderView.initialize()
	await nextFrame()
	Dialog.initialize()
	Tween.initialize()
	MapView.initialize()
	await nextFrame()

	// for no apparent reason the layers are not available inside TreasureView
	Europe.initialize()
	await nextFrame()
	TreasureView.initialize(Foreground.get().permanent)
	YearView.initialize(Foreground.get().permanent)
	Message.log('Restoring game state...')
	await nextFrame()
	Record.load()
	await nextFrame()

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
		Keyboard.initialize()
	}, 3000)

	document.addEventListener('visibilitychange', () => {
		if (document.hidden) {
			MainLoop.stop()
		} else {
			MainLoop.start()
		}
	})

	MainLoop.setUpdate(update)
	MainLoop.setDraw(draw)
	MainLoop.start()
}

const save = Record.save

export default {
	start,
	load,
	save,
	preload
}