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

const revive = (data, type, id) => {
	if (idCounter < id) {
		idCounter = id + 1
	}
	const entity = getModule(type).load(data)
	
	records.push({
		id,
		entity,
		type
	})

	return entity
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

const loadSingleRecord = record => {
	return {	
		id: record.id,
		type: record.type,
		entity: getModule(record.type).load(record.data)
	}
}


const resolveReference = referenceId => {
	// found alive
	const alive = records.find(record => record.id === referenceId)
	if (alive) {
		return alive.entity
	}

	// found raw data, revive
	const dead = snapshot.entities.find(snapshot => snapshot.id === referenceId)
	if (dead && dead.type) {
		return revive(dead.data, dead.type, referenceId)
	}

	// not found :/
	console.warn('reference not found', referenceId)
	return { referenceId: referenceId }
}

const resolveTile = index => tiles[index]

const isObject = x => typeof x === 'object' && !Array.isArray(x)
const isArray = x => Array.isArray(x)

const parseTree = node => {
	if (!node) {
		return node
	}
	if (isArray(node)) {
		return node.map(value => parseTree(value))
	}
	if (isObject(node)) {	
		let result = Object.entries(node)
			.map(([key, value]) => {
				if (key === 'referenceId') {
					return ['_resolvedReference', resolveReference(value)]
				}
				if (key === 'tileIndex') {
					return ['_resolvedTile', resolveTile(value)]	
				}
				return [key, parseTree(value)]
			})
			.reduce((obj, [key, value]) => ({ ...obj, [key]: value }), {})
		result = {
			...result,
			...result._resolvedReference,
			...result._resolvedTile,
		}
		delete result._resolvedReference
		delete result._resolvedTile
		return result
	}
	return node
}

const dereference = record => ({
	id: record.id,
	type: record.type,
	data: parseTree(record.data)
})

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
	snapshot.entities = snapshot.entities.map(dereference)
	snapshot.entities.filter(record => !record.isAlive)
		.forEach(record => revive(record.data, record.type, record.id))

	const mapView = new MapView()

	Background.restart()
}


export default {
	add,
	addTile,
	reference,
	referenceTile,
	save,
	load
}