import LA from 'util/la'
import PathFinder from 'util/pathFinder'
import Message from 'util/message'

import MapEntity from 'entity/map'
import Unit from 'entity/unit'
import Tile from 'entity/tile'

import Factory from 'command/factory'
import Move from 'command/move'
import Commander from 'command/commander'
import Unload from 'command/unload'


const canLoad = ship => (!ship.commander.state.currentCommand ||
	ship.commander.state.currentCommand.type === 'load' ||
	ship.commander.state.currentCommand.type === 'unload')

const canLoadTreasure = ship => (!ship.commander.state.currentCommand ||
	ship.commander.state.currentCommand.type === 'load' ||
	ship.commander.state.currentCommand.type === 'unload') && ship.properties.canTransportTreasure

const inMoveDistance = (coords1, coords2) => LA.distanceManhatten(coords1, coords2) <= 1

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
		Message.warn('invalid coords', unit.name, coords)
	}

	if (!MapEntity.tile(coords)) {
		Message.warn('no targetTile', coords, unit.name, state)
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
					if (targetTile.forest) {
						displayName += ' to forest'
					} else if (targetTile.mountains) {
						displayName += ' to mountains'
					} else if (targetTile.hills) {
						displayName += ' to hills'
					} else {
						displayName += ' to planes'
					}
					const closeColony = PathFinder.findNearColony(unit)
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
		const target = Tile.get(coords)

		const shipsAtTarget = Unit.at(coords).filter(unit => unit.domain === 'sea')
		if (unit.domain === 'land' &&
				target.domain === 'sea' &&
				shipsAtTarget.some(unit.treasure ? canLoadTreasure : canLoad) &&
				inMoveDistance(unit.mapCoordinates, coords)) {
			Message.warn('boarding ships is unsupported now')
			// const transport = shipsAtTarget.find(unit.treasure ? canLoadTreasure : canLoad)
			// Commander.scheduleBehind(transport.commander, LoadUnit.create({ transport, passenger: unit }))
			// Commander.scheduleInstead(unit.commander, BoardTransport.create({ unit, transport }))
		}

		if (unit.domain === 'sea' &&
			unit.passengers.length > 0 &&
			target.domain === 'land' &&
			!target.colony
			&& Tile.radius(target).includes(unit.tile)) {
			Commander.scheduleInstead(unit.commander, Unload.create(unit, target.mapCoordinates))
		}
	}

	return {
		init,
		finished
	}	
})
