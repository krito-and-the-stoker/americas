import LZString from 'lz-string'
import MainLoop from 'mainloop.js'
import Util from '../util/util'

import Colonist from '../entity/colonist'
import Colony from '../entity/colony'
import MapEntity from '../entity/map'
import Tile from '../entity/tile'
import Unit from '../entity/unit'
import Europe from '../entity/europe'
import Treasure from '../entity/treasure'
import Market from '../entity/market'
import Tribe from '../entity/tribe'
import Settlement from '../entity/settlement'

import MapView from '../render/map'
import Foreground from '../render/foreground'
import Background from '../render/background'
import RenderView from '../render/view'
import UnitView from '../view/map/unit'
import Time from '../timeline/time'
import PathFinder from '../util/pathFinder'

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
	records.find(record => record.entity === entity).destroy()
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
	
	records.push({
		id: record.id,
		entity: record.entity,
		type: record.type,
		destroy: update(record.type, record.entity)
	})
	

	return record.entity
}

const dump = () => {
	console.log(records)
}

const reviveTile = (data, index) => {
	const tile = Tile.load(data, index)
	tiles[tile.index] = tile
}

const reference = entity => (entity ? {
	[REFERENCE_KEY]: records.find(record => record.entity === entity).id
} : null)

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
	tribe: Tribe
})[name]

const saveSingleRecord = record => ({
	id: record.id,
	type: record.type,
	data: getModule(record.type).save(record.entity)
})

const saveSingleTile = tile => Tile.save(tile)


const save = () => {
	console.log('saving...')
	lastSave = JSON.stringify({
		entities: records.map(saveSingleRecord),
		tiles: Object.values(tiles).map(saveSingleTile),
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
					console.log('entities saved to local storage', e.data.length)
				}
				worker.postMessage(lastSave)
			} else {		
				const compressed = LZString.compress(lastSave)
				window.localStorage.setItem('lastSaveCompressed', compressed)
				console.log('entities saved to local storage', compressed.length)
			}
		} else {
			window.localStorage.setItem('lastSave', lastSave)
			console.log('entities saved to local storage', lastSave.length)
		}
	} else {
		console.log('entities saved in memory', lastSave.length)
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
			dead.listeners.push(fn)
		}
	}
}

let loadedListeners = []
const entitiesLoaded = fn => loadedListeners.push(fn)

const load = () => {
	console.log('loading...')
	Foreground.shutdown()

	records.forEach(record => record.destroy())
	
	loadedListeners = []
	records = []
	tiles = []
	if (SAVE_TO_LOCAL_STORAGE) {
		if (USE_COMPRESSION) {
			lastSave = LZString.decompress(window.localStorage.getItem('lastSaveCompressed'))
		} else {
			lastSave = window.localStorage.getItem('lastSave')
		}
	}
	snapshot = JSON.parse(lastSave)
	globals = snapshot.globals
	snapshot.tiles.forEach(reviveTile)
	snapshot.entities.forEach(record => record.listeners = [])
	snapshot.entities.forEach(revive)
	Time.load(snapshot.time)
	Treasure.load(snapshot.treasure)
	Market.load(snapshot.market)
	Europe.load(snapshot.europe)
	UnitView.load(snapshot.unitView)
	PathFinder.initialize()

	loadedListeners.forEach(fn => fn())

	const mapView = new MapView()

	RenderView.restart()
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
	REFERENCE_KEY
}