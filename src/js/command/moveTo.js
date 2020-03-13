import Util from 'util/util'
import PathFinder from 'util/pathFinder'

import MapEntity from 'entity/map'
import Unit from 'entity/unit'
import Tile from 'entity/tile'

import Factory from 'command/factory'
import Move from 'command/move'
import Commander from 'command/commander'
import LoadUnit from 'command/loadUnit'
import Unload from 'command/unload'


const canLoad = ship => (!ship.commander.state.currentCommand ||
	ship.commander.state.currentCommand.type === 'load' ||
	ship.commander.state.currentCommand.type === 'unload')

const canLoadTreasure = ship => (!ship.commander.state.currentCommand ||
	ship.commander.state.currentCommand.type === 'load' ||
	ship.commander.state.currentCommand.type === 'unload') && ship.properties.canTransportTreasure

const inMoveDistance = (coords1, coords2) => Math.abs(coords1.x - coords2.x) <= 1 && Math.abs(coords1.y - coords2.y) <= 1

export default Factory.commander('MoveTo', {
	unit: {
		type: 'entity',
		required: true
	},
	coords: {
		type: 'raw',
		required: true
	},
}, {
	id: 'moveTo',
	display: 'Travelling',
	icon: 'go'
}, state => {
	const { unit, coords, commander } = state
	if (coords.x < 0 || coords.y < 0 || coords.x >= MapEntity.get().numTiles.x || coords.y >= MapEntity.get().numTiles.y) {
		console.warn('invalid coords', unit.name, coords)
	}

	if (!MapEntity.tile(coords)) {
		console.warn('no targetTile', coords, unit.name, state)
		coords.x = Math.round(coords.x)
		coords.y = Math.round(coords.y)
	}

	const init = () => {
		const targetTile = MapEntity.tile(coords)

		let displayName = Unit.area(unit) === 'land' ? 'Travelling' : 'Navigating'
		if (targetTile.discoveredBy.includes(unit.owner)) {		
			if (targetTile.colony) {
				displayName += ` to ${targetTile.colony.name}`
			} else if (targetTile.settlement) {
				displayName += ` to ${targetTile.settlement.tribe.name} village`
			} else {
				if (targetTile.domain === 'sea') {
					displayName += ' to the sea'
				} else {					
					const closeColony = PathFinder.findNearColony(unit)
					if (targetTile.forest) {
						displayName += ' to forest'
					} else if (targetTile.mountains) {
						displayName += ' to mountains'
					} else if (targetTile.hills) {
						displayName += ' to hills'
					} else {
						displayName += ' to planes'
					}
					if (closeColony) {
						displayName += ` near ${closeColony.name}`
					}
				}
			}
		} else {
			displayName += ' to undiscovered ' + (unit.domain === 'sea' ? 'waters' : 'lands')
		}
		Factory.update.display(state, displayName)

		Commander.scheduleInstead(commander, Move.create({ unit, coords }))
	}

	const finished = () => {
		const target = MapEntity.tile(coords)
		return

		const shipsAtTarget = Unit.at(coords).filter(unit => unit.domain === 'sea')
		if (unit.domain === 'land' &&
				target.domain === 'sea' &&
				shipsAtTarget.some(unit.treasure ? canLoadTreasure : canLoad) &&
				inMoveDistance(unit.tile.mapCoordinates, coords)) {
			const ship = shipsAtTarget.find(unit.treasure ? canLoadTreasure : canLoad)
			Commander.scheduleBehind(ship.commander, LoadUnit.create({ transport: ship, passenger: unit }))
			Commander.scheduleInstead(unit.commander, Move.create({ unit, coords }))
		}

		if (unit.domain === 'sea' &&
			unit.passengers.length > 0 &&
			target.domain === 'land' &&
			!target.colony
			&& Util.distance(unit.mapCoordinates, state.lastPoint) < 1) {
			const targetCoords = Tile.diagonalNeighbors(MapEntity.tile(unit.mapCoordinates))
				.filter(n => n.domain === 'land')
				.map(n => n.mapCoordinates)
				.reduce((min, c) => Util.distance(coords, c) < Util.distance(coords, min) ? c : min, unit.mapCoordinates)
			Commander.scheduleInstead(unit.commander, Unload.create(unit, targetCoords))
		}
	}

	return {
		init,
		finished
	}	
})
