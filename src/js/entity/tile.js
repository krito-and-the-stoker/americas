import Terrain from 'data/terrain.json'
import MovementCosts from 'data/movementCosts'
import Yield from 'data/yield'
import Goods from 'data/goods'

import Util from 'util/util'
import Member from 'util/member'
import Record from 'util/record'
import Binding from 'util/binding'

import Time from 'timeline/time'

import Owner from 'entity/owner'
import MapEntity from 'entity/map'


const create = ({ id, layers, index }) => {
	const [name, terrain] = Object.entries(Terrain).find(([, terrain]) => terrain.id === id)
	if (!terrain) {
		console.warn(`No terrain type found for id ${id}.`)
		throw new Error(`No terrain type found for id ${id}.`)
	}

	const tile = {
		index,
		id,
		name,
		domain: Terrain[name].domain,
		terrain: terrain,
		forest: layers.top === Terrain.forest.id,
		mountains: layers.top === Terrain.mountains.id,
		riverSmall: layers.riverSmall === Terrain.smallRiver.id,
		riverLarge: layers.riverLarge === Terrain.largeRiver.id,
		mapCoordinates: MapEntity.mapCoordinates(index),
		zone: layers.zone,
		harvestedBy: null,
		plowed: false,
		road: false,
		coast: false,
		coastTerrain: null,
		discoveredBy: [],
		units: [],
	}

	if (tile.domain === 'sea') {
		tile.forest = false
	}
	tile.rumors = tile.domain === 'land' && Math.random() < 0.04
	tile.river = tile.riverLarge || tile.riverSmall

	tile.hills = layers.top === Terrain.hills.id || (tile.mountains && Math.random() > 0.1)
	tile.treeVariation = tile.riverLarge || Math.random() > (tile.river ? 0.3 : 0.9) ? 1 : 0
	tile.mountainVariation = Math.random() > (tile.river ? 0.2 : 0.75) && !tile.bonus || tile.mountains
	tile.hillVariation = Math.random() > (tile.river ? 0.2 : 0.75) && !tile.bonus

	tile.terrainName = terrainName(tile)
	tile.bonus = (tile.terrainName !== 'sea lane') && (Math.random() < (tile.domain === 'land' ? 0.07 : 0.04))

	tile.left = () => left(tile)
	tile.up = () => up(tile)
	tile.right = () => right(tile)
	tile.down = () => down(tile)

	tile.discovered = () => discovered(tile)

	Record.addTile(tile)
	return tile
}

const initialize = tile => {
	const updateTreeVariation = colonyOrSettlement => {
		if (colonyOrSettlement) {
			if (tile.forest) {
				tile.treeVariation = 2
			}
		}
		updateTile(tile)
	}

	listen.settlement(tile, updateTreeVariation)
	listen.colony(tile, updateTreeVariation)
	listen.discovered(tile, discovered => discovered ? computeSurroundingAreaInfluence(tile) : null)
}

const terrainName = tile =>
	(tile.forest && tile.domain === 'land') ? `${tile.name}WithForest` :
		(tile.mountains ? 'mountains' :
			(tile.hills ? 'hills' : tile.name))

const keys = ['id', 'forest', 'treeVariation', 'hills', 'hillVariation', 'mountains', 'mountainVariation', 'riverSmall', 'riverLarge', 'bonus', 'plowed', 'road', 'coast', 'discoveredBy', 'rumors', 'harvestedBy', 'currentlyVisible']
const type = ['int','bool',   'int',           'bool',  'bool',          'bool',      'bool',              'bool',       'bool',       'bool',  'bool',   'bool', 'bool',  'references',   'bool',   'reference',   'bool']
const save = tile => compress([
	tile.id,
	tile.forest,
	tile.treeVariation,
	tile.hills,
	tile.hillVariation,
	tile.mountains,
	tile.mountainVariation,
	tile.riverSmall,
	tile.riverLarge,
	tile.bonus,
	tile.plowed,
	tile.road,
	tile.coast,
	tile.discoveredBy.map(Record.reference),
	tile.rumors,
	Record.reference(tile.harvestedBy)
])

const compress = values => values.map((value, index) => {
	if (type[index] === 'bool') {
		return value ? 1 : 0
	}
	if (type[index] === 'reference') {
		return value ? value[Record.REFERENCE_KEY] : 0
	}
	if (type[index] === 'references') {
		return value.map(one => one ? one[Record.REFERENCE_KEY] : 0).join('-')
	}
	return value
})

export const saveSerializedCopy = tile => compress([
	tile.id,
	tile.forest,
	tile.treeVariation,
	tile.hills,
	tile.hillVariation,
	tile.mountains,
	tile.mountainVariation,
	tile.riverSmall,
	tile.riverLarge,
	tile.bonus,
	tile.plowed,
	tile.road,
	tile.coast,
	tile.discoveredBy,
	tile.rumors,
	tile.harvestedBy
])

const serializableCopy = tile => ({
	id: tile.id,
	forest: tile.forest,
	treeVariation: tile.treeVariation,
	hills: tile.hills,
	hillVariation: tile.hillVariation,
	mountains: tile.mountains,
	mountainVariation: tile.mountainVariation,
	riverSmall: tile.riverSmall,
	riverLarge: tile.riverLarge,
	bonus: tile.bonus,
	plowed: tile.plowed,
	road: tile.road,
	coast: tile.coast,
	discoveredBy: tile.discoveredBy.map(Record.reference),
	rumors: tile.rumors,
	harvestedBy: Record.reference(tile.harvestedBy)
})

const load = (data, index) => {
	const tile = data
		.map((value, key) => {
			if (type[key] === 'bool') {
				return value === 1
			}
			if (type[key] === 'reference') {
				return value ? {
					[Record.REFERENCE_KEY]: value
				} : null
			}
			if (type[key] === 'references') {
				return value.split('-').filter(x => x.length > 0).map(one => one ? ({
					[Record.REFERENCE_KEY]: Number(one)
				}) : null)
			}
			return value
		})
		.reduce((tile, value, index) => ({ ...tile, [keys[index]]: value }), {})
	tile.index = index
	const [name, terrain] = Object.entries(Terrain).find(([, terrain]) => terrain.id === tile.id)
	if (!terrain) {
		console.warn(`No terrain type found for id ${tile.id}.`)
		throw new Error(`No terrain type found for id ${tile.id}.`)
	}
	tile.name = name
	tile.terrain = terrain
	tile.domain = Terrain[name].domain
	tile.mapCoordinates = MapEntity.mapCoordinates(tile.index)

	tile.river = tile.riverLarge || tile.riverSmall
	tile.terrainName = terrainName(tile)

	tile.left = () => left(tile)
	tile.up = () => up(tile)
	tile.right = () => right(tile)
	tile.down = () => down(tile)
	tile.discovered = () => tile.currentlyVisible

	tile.units = []

	Record.dereferenceLazy(tile.harvestedBy, entity => update.harvestedBy(tile, entity))
	
	Record.entitiesLoaded(() => {
		tile.discoveredBy = tile.discoveredBy.map(Record.dereference)
		tile.discovered = () => discovered(tile)

		tile.discoveredBy.forEach(owner =>
			Owner.listen.visible(owner, () => {
				if (tile.currentlyDiscovered !== discovered(tile)) {
					update.currentlyDiscovered(tile, discovered(tile))
					updateTile(tile)
				}
			}))

		initialize(tile)
	})

	return tile	
}

const seaWeight = 10
const riverLargeWeight = 7
const riverSmallWeight = 3
const mountainWeight = -3
const hillWeight = -3
const temperature = (tile, season) => {
	// 1 is summer, -1 is winter
	return tile.baseTemperature + season * tile.relativeHeight * 35
		+ seaWeight * (tile.influenceOfTheSea || 0)
		+ riverLargeWeight * (tile.influenceOfRiverLarge || 0)
		+ riverSmallWeight * (tile.influenceOfRiverSmall || 0)
		+ mountainWeight * (tile.influenceOfTheMountains || 0)
		+ hillWeight * (tile.influenceOfTheHills || 0)
}


const discover = (tile, owner) => {
	if (!tile.discoveredBy.includes(owner)) {
		tile.discoveredBy.push(owner)
		Owner.listen.visible(owner, () => {		
			if (tile.currentlyDiscovered !== discovered(tile)) {
				update.currentlyDiscovered(tile, discovered(tile))
				updateTile(tile)
			}
		})
	}
}

const discovered = tile => tile.discoveredBy.some(owner => owner.visible)
const	neighbors = tile => [left(tile), up(tile), right(tile), down(tile)].filter(n => n)
const diagonalNeighbors = tile => {
	let result = neighbors(tile)
	if (up(tile)) {
		result = result.concat([left(up(tile)), right(up(tile))])
	}
	if (down(tile)) {
		result = result.concat([left(down(tile)), right(down(tile))])
	}
	if (!up(tile) && !down(tile)) {
		console.warn('tile has no vertical neighbors', tile)
	}
	return result.filter(n => n)
}
const radius = tile => diagonalNeighbors(tile).concat([tile])

const left = tile => MapEntity.tile({	
	x: tile.mapCoordinates.x - 1,
	y: tile.mapCoordinates.y
})

const up = tile => MapEntity.tile({	
	x: tile.mapCoordinates.x,
	y: tile.mapCoordinates.y - 1
})

const right = tile => MapEntity.tile({	
	x: tile.mapCoordinates.x + 1,
	y: tile.mapCoordinates.y
})

const down = tile => MapEntity.tile({	
	x: tile.mapCoordinates.x,
	y: tile.mapCoordinates.y + 1
})

const isNextTo = (tile, other) => neighbors(tile).includes(other)

const movementCost = (from, to) => {
	if (neighbors(to).includes(from)) {
		if (to.domain === 'land' && from.domain === 'land' && to.river && from.river) {
			return MovementCosts.river
		}
	}
	if (from.road && to.road) {
		return MovementCosts.road
	}
	if (to.colony) {
		if (from.domain === 'sea') {
			return MovementCosts.harbour
		} else {
			return MovementCosts.colony
		}
	}
	if (from.domain === 'sea' || to.domain === 'sea') {
		return MovementCosts.ocean
	}
	return MovementCosts[to.terrainName]
}

const decideCoastTerrain = tile => {
	if(tile.terrain && tile.terrain.domain === 'sea') {
		const coastalNeighbor = neighbors(tile).find(other => other.terrain && other.terrain.domain === 'land')
		tile.coastTerrain = coastalNeighbor ? coastalNeighbor.terrain : null
		if (!tile.coastTerrain) {
			const coastalDiagonalNeighbor = diagonalNeighbors(tile).find(other => other.terrain && other.terrain.domain === 'land')
			tile.coastTerrain = coastalDiagonalNeighbor ? coastalDiagonalNeighbor.terrain : null
		}
	}

	if(tile.coastTerrain) {
		tile.coast = true
	}
}

const decideCoastalSea = tile => {
	tile.isCoastalSea = tile.terrain && tile.domain === 'sea' && !tile.coast && diagonalNeighbors(tile).some(other => other.coast)
}

const computeSurroundingAreaInfluence = tile => {
	if (typeof tile.influenceOfTheSea !== 'undefined') {
		return
	}
	tile.relativeHeight = ((MapEntity.get().numTiles.y / 2) - tile.mapCoordinates.y) / (MapEntity.get().numTiles.y / 2)
	tile.baseTemperature = 30 - 80 * Math.abs(tile.relativeHeight) * Math.abs(tile.relativeHeight)

	const radius = 20
	tile.influenceOfTheSea = 0
	tile.influenceOfRiverLarge = 0
	tile.influenceOfRiverSmall = 0
	tile.influenceOfTheMountains = 0
	tile.influenceOfTheHills = 0
	if (tile.domain === 'land' || tile.coast) {
		Util.quantizedRadius(tile.mapCoordinates, radius)
			.filter(coords => MapEntity.tile(coords))
			.map(coords => {
				const other = MapEntity.tile(coords)
				if (other.domain === 'sea' && tile.influenceOfTheSea < 1 - Util.distance(coords, tile.mapCoordinates) / radius) {
					tile.influenceOfTheSea = 1 - Util.distance(coords, tile.mapCoordinates) / radius
				}
				if (other.riverLarge && tile.influenceOfRiverLarge < 1 - Util.distance(coords, tile.mapCoordinates) / radius) {
					tile.influenceOfRiverLarge = 1 - Util.distance(coords, tile.mapCoordinates) / radius
				}
				if (other.riverSmall && tile.influenceOfRiverSmall < 1 - Util.distance(coords, tile.mapCoordinates) / radius) {
					tile.influenceOfRiverSmall = 1 - Util.distance(coords, tile.mapCoordinates) / radius
				}
				if (other.mountains && tile.influenceOfTheMountains < 1 - Util.distance(coords, tile.mapCoordinates) / radius) {
					tile.influenceOfTheMountains = 1 - Util.distance(coords, tile.mapCoordinates) / radius
				}
				if (other.hills && tile.influenceOfTheHills < 1 - Util.distance(coords, tile.mapCoordinates) / radius) {
					tile.influenceOfTheHills = 1 - Util.distance(coords, tile.mapCoordinates) / radius
				}
			})
	}
	tile.influenceOfTheSea *= tile.influenceOfTheSea
	tile.influenceOfRiverLarge *= tile.influenceOfRiverLarge
	tile.influenceOfRiverSmall *= tile.influenceOfRiverSmall
	tile.influenceOfTheMountains *= tile.influenceOfTheMountains
	tile.influenceOfTheHills *= tile.influenceOfTheHills
}

const	applyModifier = (tile, base, name, resource, where) => {
	const terrainName = tile.terrainName
	if (Yield[terrainName][where][resource]) {
		const mod = Yield[terrainName][where][resource][name]
		if (mod) {
			if (mod[0] === '+')
				return base + parseFloat(mod.substr(1))
			if (mod[0] === '*')
				return base * parseFloat(mod.substr(1))

			return mod
		}
	}

	return base
}

const production = (tile, resource, colonist = null) => {
	const where = colonist ? 'field' : 'colony'
	if (tile.domain === 'sea' && colonist && colonist.colony && !colonist.colony.buildings.harbour.level) {
		return 0
	}

	let base = applyModifier(tile, 0, 'base', resource, where)
	if (base > 0 && colonist && colonist.colony) {
		base += colonist.colony.productionBonus
	}

	const modifiers = ['coast', 'plowed', 'river', 'road']
	let result = modifiers
		.reduce((result, name) => (tile[name] ? applyModifier(tile, result, name, resource, where) : result), base)
	if (tile.bonus) {
		result = applyModifier(tile, result, 'resource', resource, where)
	}
	if (colonist && ((colonist.expert === Goods[resource].expert && tile.domain === 'land') || (colonist.expert === 'fisher' && tile.domain === 'sea'))) {
		result = applyModifier(tile, result, 'expert', resource, where)
	}


	return result
}

const colonyProductionGoods = tile => Object.keys(Yield[tile.terrainName].colony)
const fieldProductionOptions = (tile, colonist) => Goods.types
	.map(good => ({ good, amount: production(tile, good, colonist) }))
	.filter(({ amount }) => amount > 0)

const neighborString = (tile, other) => {
	const result = (c1, c2) => {
		const x1 = c1.x
		const x2 = c2.x
		const y1 = c1.y
		const y2 = c2.y
		if (x1 === x2 && y1 - 1 === y2)
			return 'up'
		if (x1 + 1 === x2 && y1 - 1 === y2)
			return 'rightup'
		if (x1 + 1 === x2 && y1 === y2)
			return 'right'
		if (x1 + 1 === x2 && y1 + 1 === y2)
			return 'rightdown'
		if (x1 === x2 && y1 + 1 === y2)
			return 'down'
		if (x1 - 1 === x2 && y1 + 1 === y2)
			return 'leftdown'
		if (x1 - 1 === x2 && y1 === y2)
			return 'left'
		if (x1 - 1 === x2 && y1 - 1 === y2)
			return 'leftup'
	}

	return result(tile.mapCoordinates, other.mapCoordinates)
}

const add = {
	unit: (tile, unit) => Member.add(tile, 'units', unit)
}

const update = {
	colony: (tile, colony) => Binding.update(tile, 'colony', colony),
	harvestedBy: (tile, harvestedBy) => Binding.update(tile, 'harvestedBy', harvestedBy),
	settlement: (tile, settlement) => Binding.update(tile, 'settlement', settlement),
	tile: tile => Binding.update(tile),
	currentlyDiscovered: (tile, value) => Binding.update(tile, 'currentlyDiscovered', value)
	// rumors: (tile, value) => Binding.update(tile, 'rumors', value)
}

const listen = {
	tile: (tile, fn) => Binding.listen(tile, null, fn),
	settlement: (tile, fn) => Binding.listen(tile, 'settlement', fn),
	colony: (tile, fn) => Binding.listen(tile, 'colony', fn),
	harvestedBy: (tile, fn) => Binding.listen(tile, 'harvestedBy', fn),
	units: (tile, fn) => Binding.listen(tile, 'units', fn),
	discovered: (tile, fn) => Binding.listen(tile, 'currentlyDiscovered', fn)
}


const clearForest = tile => {
	tile.forest = false
	tile.bonus = Math.random() < 0.07
	tile.terrainName = terrainName(tile)

	updateTile(tile)
}

const plow = tile => {
	tile.plowed = true

	updateTile(tile)
}

const constructRoad = tile => {
	tile.road = true

	updateTile(tile)
}

const removeRoad = tile => {
	tile.road = false

	updateTile(tile)
}

const updateRumors = (tile, value) => {
	tile.rumors = value

	updateTile(tile)
}

const updateTile = center => {
	radius(center).forEach(update.tile)
}


export default {
	initialize,
	create,
	discover,
	isNextTo,
	production,
	update,
	colonyProductionGoods,
	fieldProductionOptions,
	decideCoastTerrain,
	decideCoastalSea,
	diagonalNeighbors,
	radius,
	movementCost,
	save,
	load,
	neighborString,
	updateRumors,
	clearForest,
	plow,
	constructRoad,
	removeRoad,
	listen,
	left,
	right,
	up,
	down,
	add,
	serializableCopy,
	temperature
}
