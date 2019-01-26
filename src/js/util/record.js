import LZString from 'lz-string'
import MainLoop from 'mainloop.js'
import FileSaver from 'file-saver'

import Util from 'util/util'
import Version from 'version/version.json'

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

import MapView from 'render/map'
import Foreground from 'render/foreground'
import Background from 'render/background'
import RenderView from 'render/view'
import UnitView from 'view/map/unit'
import Time from 'timeline/time'
import PathFinder from 'util/pathFinder'
import Message from 'view/ui/message'

const REFERENCE_KEY = 'referenceId'

const SAVE_TO_LOCAL_STORAGE = true
const USE_COMPRESSION = false


let lastSave = null

let idCounter = 0
const makeId = () => idCounter += 1

let	records = []
let snapshot = []
let globals = {}
let tiles = {}
let listeners = {}
const add = (type, entity) => {
	records.push({
		id: makeId(),
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
		record.destroy()
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
	listeners[type].push(fn)
}

const update = (type, entity) => {
	if (!listeners[type]) {
		initListeners(type)
	}
	return Util.mergeFunctions(listeners[type].map(fn => fn(entity)).filter(fn => typeof fn === 'function'))
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

const reviveTile = (data, index) => {
	const tile = Tile.load(data, index)
	tiles[tile.index] = tile
}

const reference = entity => {
	if (!entity) {
		return null
	}
	const record = records.find(record => record.entity === entity)
	if (!record) {
		console.warn('could not create reference, entity not found', entity)
		return null
	}
	return {
		[REFERENCE_KEY]: record.id
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

const save = () => {
	Message.log('Saving...')
	tileDictionary = {}
	tileLookup = []
	const tileIndices = Object.values(tiles).map(saveSingleTile).map(getTileLookup)
	lastSave = JSON.stringify({
		game: 'americas',
		revision: Version.revision,
		entities: records.map(saveSingleRecord),
		tileLookup,
		tiles: tileIndices,
		time: Time.save(),
		unitView: UnitView.save(),
		europe: Europe.save(),
		treasure: Treasure.save(),
		market: Market.save(),
		globals
	})
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
				console.warn('Could ot find reference for', ref)
			}
			dead.listeners.push(fn)
		}
	}
}

let beforeLoadedListeners = []
let loadedListeners = []
const entitiesLoaded = fn => loadedListeners.push(fn)
const beforeEntitiesLoaded = fn => beforeLoadedListeners.push(fn)

const load = (src = null) => {
	Message.log('Loading...')
	Foreground.shutdown()

	records.forEach(record => record.destroy())
	
	loadedListeners = []
	records = []
	tiles = []
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
	snapshot = JSON.parse(lastSave)
	if (snapshot.game !== 'americas') {
		console.warn('The save game does not appear to be a valid americas save game.')
	}
	if (snapshot.revision !== Version.revision) {
		console.warn('The save games version does not match the version of the game. If you see no errors you can ignore this warning.')
	}
	globals = snapshot.globals
	tileLookup = snapshot.tileLookup
	snapshot.entities.forEach(record => record.listeners = [])
	MapEntity.prepare()
	snapshot.tiles.map(resolveLookup).forEach(reviveTile)
	MapEntity.load()
	const mapView = new MapView()
	snapshot.entities.forEach(revive)
	Time.load(snapshot.time)
	Treasure.load(snapshot.treasure)
	Market.load(snapshot.market)
	Europe.load(snapshot.europe)
	beforeLoadedListeners.forEach(fn => fn())
	loadedListeners.forEach(fn => fn())

	PathFinder.initialize()
	UnitView.load(snapshot.unitView)

	RenderView.restart()
	Message.log('Game loaded')
}

const download = () => {
	save()
	var blob = new Blob([lastSave], {type: "application/json;charset=utf-8"})
	FileSaver.saveAs(blob, "americas-save-game.json")
}

const upload = () => {
	const input = document.createElement('input')
	input.setAttribute('type', 'file')
	input.setAttribute('accept', 'application/json, .json')
	input.addEventListener('change', () => {	
		const file = input.files[0]
		if (file) {
	    var reader = new FileReader();
	    reader.readAsText(file, "UTF-8")
	    reader.onload = evt => {
	      load(evt.target.result)
	      document.body.removeChild(input)
	    }
	    reader.onerror = function (evt) {
	      console.log('oh no, something went wrong :/', evt)
	      document.body.removeChild(input)
	    }
		}	
	})
	document.body.appendChild(input)

	const evt = document.createEvent("MouseEvents")
  evt.initEvent("click", true, false)
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
	save,
	load,
	dump,
	getAll,
	download,
	upload,
	REFERENCE_KEY
}