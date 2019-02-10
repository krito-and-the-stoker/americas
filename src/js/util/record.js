import LZString from 'lz-string'
import FileSaver from 'file-saver'

import Version from 'version/version.json'

import Util from 'util/util'
import PathFinder from 'util/pathFinder'
import Message from 'util/message'
import Events from 'util/events'

import Time from 'timeline/time'

import Colonist from 'entity/colonist'
import Colony from 'entity/colony'
import MapEntity from 'entity/map'
import Tile from 'entity/tile'
import Unit from 'entity/unit'
import Europe from 'entity/europe'
import Treasure from 'entity/treasure'
import Market from 'entity/market'
import Tribe from 'entity/tribe'
import Settlement from 'entity/settlement'
import Owner from 'entity/owner'


const REFERENCE_KEY = 'referenceId'

const SAVE_TO_LOCAL_STORAGE = true
const USE_COMPRESSION = false


let lastSave = null

let idCounter = 0
const makeId = () => idCounter += 1

let worker = null
let autosaveInProgress = false
let	records = []
let snapshot = { entities: [] }
let globals = {}
let tiles = []
let listeners = {}
const add = (type, entity) => {
	entity.referenceId = makeId()
	records.push({
		id: entity.referenceId,
		entity,
		type,
		destroy: update(type, entity)
	})
}

const remove = entity => {
	const record = records.find(record => record.entity === entity)
	if (!record) {
		console.warn('cannot remove, entity not found. Possible duplicate removal', entity)
	} else {
		Util.execute(record.destroy)
	}
	records = records.filter(record => record.entity !== entity)
}


const initListeners = type => {
	listeners[type] = []
}

const listen = (type, fn) => {
	if (!listeners[type]) {
		initListeners(type)
	}
	records
		.filter(record => record.type === type)
		.forEach(record => {
			record.destroy = [
				record.destroy,
				fn(record.entity)
			]
		})

	listeners[type].push(fn)

	return () => listeners[type] = listeners[type].filter(f => f !== fn)
}

const update = (type, entity) => {
	if (!listeners[type]) {
		initListeners(type)
	}
	return listeners[type].map(fn => fn(entity))
}


const addTile = tile => {
	tiles[tile.index] = tile
}

const setGlobal = (key, value) => {
	globals[key] = value
}
const getGlobal = key => globals[key]

const getAll = type => records
	.filter(record => record.type === type)
	.map(record => record.entity)

const revive = (record) => {
	if (record.entity) {
		return record.entity
	}

	if (idCounter < record.id) {
		idCounter = record.id + 1
	}

	record.entity = getModule(record.type).load(record.data)
	record.entity.referenceId = record.id
	record.listeners.forEach(fn => fn(record.entity))	
	records.push(record)

	beforeEntitiesLoaded(() => {
		record.destroy = update(record.type, record.entity)
	})

	return record.entity
}

const dump = () => {
	console.log(records)
	console.log(globals)

	window.Record = {
		add,
		remove,
		listen,
		addTile,
		reference,
		referenceTile,
		dereferenceTile,
		dereference,
		dereferenceLazy,
		entitiesLoaded,
		setGlobal,
		getGlobal,
		save,
		load,
		dump,
		getAll,
		download,
		upload,
		REFERENCE_KEY
	}

	window.Colonist = Colonist
	window.Colony = Colony
	window.MapEntity = MapEntity
	window.Tile = Tile
	window.Unit = Unit
	window.Europe = Europe
	window.Treasure = Treasure
	window.Market = Market
	window.Tribe = Tribe
	window.Settlement = Settlement
	window.Owner = Owner
}

const state = () => ({
	records: records.map(saveSingleRecord).data,
	tiles: tiles.map(saveSingleTile),
	time: Time.save(),
	europe: Europe.save(),
	treasure: Treasure.save(),
	market: Market.save(),
	globals
})

const reviveTile = (data, index) => {
	const tile = Tile.load(data, index)
	tiles[tile.index] = tile
}

const reference = entity => {
	if (!entity) {
		return null
	}

	return {
		[REFERENCE_KEY]: entity.referenceId
	}
}

const referenceTile = tile => (tile ? {
	tileIndex: tile.index
} : null)

const getModule = name => ({
	colonist: Colonist,
	colony: Colony,
	map: MapEntity,
	tile: Tile,
	unit: Unit,
	settlement: Settlement,
	tribe: Tribe,
	owner: Owner
})[name]

const saveSingleRecord = record => ({
	id: record.id,
	type: record.type,
	data: getModule(record.type).save(record.entity)
})

const saveSingleTile = tile => Tile.save(tile)

let tileDictionary = {}
let tileLookup = []
const getTileLookup = tile => {
	const s = tile.join('-')
	if (!tileDictionary[s]) {
		tileDictionary[s] = tileLookup.length
		tileLookup.push(tile)
	}

	return tileDictionary[s]
}

// defaults to identity when no lookup table found
const resolveLookup = index => tileLookup ? tileLookup[index] : index

const serialize = () => {
	setGlobal('revision', Version.revision)
	tileDictionary = {}
	tileLookup = []
	const tileIndices = tiles.map(saveSingleTile).map(getTileLookup)
	const content = JSON.stringify({
		game: 'americas',
		revision: Version.revision,
		entities: records.map(saveSingleRecord),
		tileLookup,
		tiles: tileIndices,
		time: Time.save(),
		europe: Europe.save(),
		treasure: Treasure.save(),
		market: Market.save(),
		globals
	})
	return content
}

const nextFrame = () => new Promise(resolve => requestAnimationFrame(resolve))
const serializeAsync = () => new Promise(async resolve => {
	setGlobal('revision', Version.revision)
	tileDictionary = {}
	tileLookup = []

	const data = {
		entities: records.map(saveSingleRecord),
		time: Time.save(),
		tiles: tiles.map(Tile.serializableCopy),
		europe: Europe.save(),
		treasure: Treasure.save(),
		market: Market.save(),
		globals
	}
	await nextFrame()

	if (autosaveInProgress) {
		return
	}
	autosaveInProgress = true

	if (window.Worker) {
		if (!worker) {
			worker = new Worker('/worker.entry.js')
		}

		worker.onmessage = e => {
			autosaveInProgress = false
			resolve(e.data)
		}

		worker.postMessage('clear')
		worker.postMessage({
			entities: data.entities,
			time: data.time,
			europe: data.europe,
			market: data.market,
			treasure: data.treasure,
			globals: data.globals,
		})

		const CHUNK_SIZE = 5000
		await Util.range(Math.ceil(data.tiles.length / CHUNK_SIZE)).reduce((wait, i) =>
			wait.then(() => {
				worker.postMessage({ tiles: data.tiles.slice(CHUNK_SIZE*i, Math.min((i+1) * CHUNK_SIZE), data.tiles.length) })
			}).then(nextFrame), nextFrame())
		await nextFrame()		
		worker.postMessage('save')
	} else {

		await nextFrame()
		data.tiles = tiles.map(saveSingleTile)
		await nextFrame()
		data.tiles = data.tiles.map(getTileLookup)
		await nextFrame()

		data.game = 'americas',
		data.revision = Version.revision
		data.tileLookup = tileLookup,

		await nextFrame()
		const content = JSON.stringify(data)
		await nextFrame()
		resolve(content)
	}
})

const autosave = async () => {
	Message.log('Saving...')
	const content = await serializeAsync()
	window.localStorage.setItem('lastSave', content)
	Message.log(`Entities saved to local storage using ${Math.round(content.length / 1024)} kb.`)	
}

const save = () => {
	Message.log('Saving...')
	lastSave = serialize()
	if (SAVE_TO_LOCAL_STORAGE) {
		if (USE_COMPRESSION) {		
			if (window.Worker) {
				const worker = new Worker('/worker.entry.js')
				worker.onmessage = e => {
					window.localStorage.setItem('lastSaveCompressed', e.data)
					Message.log(`Entities saved to local storage using ${e.data.length} bytes.`)
				}
				worker.postMessage(lastSave)
			} else {		
				const compressed = LZString.compress(lastSave)
				window.localStorage.setItem('lastSaveCompressed', compressed)
				Message.log(`Entities saved to local storage using ${compressed.length} bytes.`)
			}
		} else {
			window.localStorage.setItem('lastSave', lastSave)
			Message.log(`Entities saved to local storage using ${lastSave.length} bytes.`)
		}
	} else {
		Message.log(`Entities saved in memory using ${lastSave.length} bytes.`)
	}
	Events.trigger('save')
}


const dereferenceTile = ref => ref ? tiles[ref.tileIndex] : null
const dereference = ref => {
	if (!ref) {
		return null
	}
	const referenceId = ref[REFERENCE_KEY]
	const alive = records.find(record => record.id === referenceId)
	if (alive) {
		return alive.entity
	}

	const dead = snapshot.entities.find(record => record.id === referenceId)
	if (dead) {
		return revive(dead)
	}

	console.warn('could not find reference for ', ref, snapshot.entities)
	return null
}
const dereferenceLazy = (ref, fn) => {
	if (!ref) {
		fn(null)
	} else {
		const referenceId = ref[REFERENCE_KEY]
		const alive = records.find(record => record.id === referenceId)
		if (alive) {
			fn(alive.entity)
		} else {
			const dead = snapshot.entities.find(record => record.id === referenceId)
			if (!dead) {
				console.warn('Could not find reference for', ref)
			} else {
				dead.listeners.push(fn)
			}
		}
	}
}

let beforeLoadedListeners = []
let loadedListeners = []
const entitiesLoaded = fn => loadedListeners.push(fn)
const beforeEntitiesLoaded = fn => beforeLoadedListeners.push(fn)

const unserialize = content => {
	records.forEach(record => Util.execute(record.destroy))
	loadedListeners = []
	records = []
	tiles = []

	snapshot = JSON.parse(content)
	if (snapshot.game !== 'americas') {
		console.warn('The save game does not appear to be a valid americas save game.')
	}
	if (snapshot.revision !== Version.revision) {
		console.warn('The save games version does not match the version of the game. If you see no errors you can ignore this warning.')
	}
	globals.revision = snapshot.revision
	globals = snapshot.globals
	tileLookup = snapshot.tileLookup
	snapshot.entities.forEach(record => record.listeners = [])
	MapEntity.prepare()
	snapshot.tiles.map(resolveLookup).forEach(reviveTile)
	MapEntity.load()
	snapshot.entities.forEach(revive)
	Time.load(snapshot.time)
	Treasure.load(snapshot.treasure)
	Market.load(snapshot.market)
	Europe.load(snapshot.europe)
	beforeLoadedListeners.forEach(fn => fn())
	loadedListeners.forEach(fn => fn())
}

const load = (src = null) => {
	Message.log('Loading...')
	// Events.trigger('shutdown')

	if (src) {
		lastSave = src
	} else {	
		if (SAVE_TO_LOCAL_STORAGE) {
			if (USE_COMPRESSION) {
				lastSave = LZString.decompress(window.localStorage.getItem('lastSaveCompressed'))
			} else {
				lastSave = window.localStorage.getItem('lastSave')
			}
		}
	}

	unserialize(lastSave)
	PathFinder.initialize()

	Events.trigger('restart')
	Message.log('Game loaded')
}

const download = () => {
	save()
	var blob = new Blob([lastSave], { type: 'application/json;charset=utf-8' })
	FileSaver.saveAs(blob, 'americas-save-game.json')
}

const upload = () => {
	const input = document.createElement('input')
	input.setAttribute('type', 'file')
	input.setAttribute('accept', 'application/json, .json')
	input.addEventListener('change', () => {	
		const file = input.files[0]
		if (file) {
			var reader = new FileReader()
			reader.readAsText(file, 'UTF-8')
			reader.onload = evt => {
				load(evt.target.result)
				document.body.removeChild(input)
			}
			reader.onerror = function (evt) {
				Message.log('oh no, something went wrong :/', evt)
				document.body.removeChild(input)
			}
		}	
	})
	document.body.appendChild(input)

	const evt = document.createEvent('MouseEvents')
	evt.initEvent('click', true, false)
	input.dispatchEvent(evt)

}


export default {
	add,
	remove,
	listen,
	addTile,
	reference,
	referenceTile,
	dereferenceTile,
	dereference,
	dereferenceLazy,
	entitiesLoaded,
	setGlobal,
	getGlobal,
	autosave,
	save,
	load,
	serialize,
	unserialize,
	dump,
	getAll,
	download,
	upload,
	state,
	REFERENCE_KEY
}