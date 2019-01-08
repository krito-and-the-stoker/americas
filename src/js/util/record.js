import LZString from 'lz-string'
import MainLoop from 'mainloop.js'

import Colonist from '../entity/colonist'
import Colony from '../entity/colony'
import MapEntity from '../entity/map'
import Tile from '../entity/tile'
import Unit from '../entity/unit'
import Europe from '../entity/europe'
import Treasure from '../entity/treasure'

import MapView from '../view/map'
import Foreground from '../render/foreground'
import Background from '../render/background'
import RenderView from '../render/view'
import UnitView from '../view/unit'
import Time from '../timeline/time'

const REFERENCE_KEY = 'referenceId'

const SAVE_TO_LOCAL_STORAGE = true
const USE_COMPRESSION = false


let lastSave = null

// start with 1 because 0 is not concidered a valid id
let idCounter = 1
const makeId = () => idCounter += 1

let records = []
let snapshot = []
let globals = {}
let tiles = {}
const add = (type, entity) => {
	records.push({
		id: makeId(),
		entity,
		type
	})
}

const addTile = tile => {
	tiles[tile.index] = tile
}

const setGlobal = (key, value) => {
	globals[key] = value
}
const getGlobal = key => globals[key]

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
		type: record.type
	})

	return record.entity
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
	unit: Unit
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


const dereferenceTile = ({ tileIndex }) => tiles[tileIndex]
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
	Europe.load(snapshot.europe)
	UnitView.load(snapshot.unitView)

	loadedListeners.forEach(fn => fn())

	const mapView = new MapView()

	RenderView.restart()
}


export default {
	add,
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
	REFERENCE_KEY
}