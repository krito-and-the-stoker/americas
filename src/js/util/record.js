import LZString from 'lz-string'

import Colonist from '../entity/colonist'
import Colony from '../entity/colony'
import MapEntity from '../entity/map'
import Tile from '../entity/tile'
import Unit from '../entity/unit'

import MapView from '../view/map'
import Foreground from '../render/foreground'
import Background from '../render/background'


const SAVE_TO_LOCAL_STORAGE = true
let lastSave = null

let idCounter = 0
const makeId = () => idCounter += 1

let records = []
let snapshot = []
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

const reviveTile = data => {
	const tile = Tile.load(data)
	tiles[tile.index] = tile
}

const reference = entity => (entity ? {
	referenceId: records.find(record => record.entity === entity).id
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
		tiles: Object.values(tiles).map(saveSingleTile)
	})
	if (SAVE_TO_LOCAL_STORAGE) {
		if (window.Worker) {
			const worker = new Worker('/worker.entry.js')
			worker.onmessage = e => {
				window.localStorage.setItem('lastSave', e.data)
				console.log('entities saved to local storage', e.data.length)
			}
			worker.postMessage(lastSave)
		} else {		
			const compressed = LZString.compress(lastSave)
			window.localStorage.setItem('lastSave', compressed)
			console.log('entities saved to local storage', compressed.length)
		}
	} else {
		console.log('entities saved', lastSave.length)
	}
}


const dereferenceTile = ({ tileIndex }) => tiles[tileIndex]
const dereference = ref => {
	if (!ref) {
		return null
	}
	const referenceId = ref.referenceId
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
		const referenceId = ref.referenceId
		const alive = records.find(record => record.id === referenceId)
		if (alive) {
			fn(alive.entity)
		} else {
			const dead = snapshot.entities.find(record => record.id === referenceId)
			dead.listeners.push(fn)
		}
	}
}


const load = () => {
	console.log('loading')

	Foreground.shutdown()
	
	records = [] // wipe records before reload (wouldn't have to, but otherwise reloading makes no sense)
	tiles = []
	if (SAVE_TO_LOCAL_STORAGE) {
		lastSave = LZString.decompress(window.localStorage.getItem('lastSave'))
	}
	snapshot = JSON.parse(lastSave)
	snapshot.tiles.forEach(reviveTile)
	snapshot.entities.forEach(record => record.listeners = [])
	snapshot.entities.forEach(revive)

	const mapView = new MapView()

	Background.restart()
}


export default {
	add,
	addTile,
	reference,
	referenceTile,
	dereferenceTile,
	dereference,
	dereferenceLazy,
	save,
	load
}