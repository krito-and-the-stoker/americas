import Util from 'util/util'
import Events from 'util/events'
import Message from 'util/message'
import LA from 'util/la'

import Time from 'timeline/time'

import Unit from 'entity/unit'

import Move from 'task/move'

import Raid from 'interaction/raid'

import State from 'ai/state'

import GetUnit from 'ai/actions/getUnit'
import Disband from 'ai/actions/disband'

import Units from 'ai/resources/units'

const isColonistInColony = unit => unit.colonist && unit.colonist.colony
const raiderTargets = relations => State.all(relations, 'colonies')
	.map(colony => ({
		mapCoordinates: colony.mapCoordinates,
		attractivity: colony.colonists.length
	}))

const raiderThreads = () => Record.getAll('unit').filter(unit => !unit.owner.ai && !isColonistInColony(unit)).map(unit => ({
		mapCoordinates: unit.mapCoordinates,
		attractivity: Unit.strength(unit),
		radius: 0.5 * unit.radius
	}))


const createRaiderMap = (raiders, targets, threads) => {
	return raiders.map(raider => ({
		raider,
		targets: [Util.min(targets, target => LA.distance(raider.mapCoordinates, target.mapCoordinates))],
		threads: threads.filter(thread => LA.distance(thread.mapCoordinates, raider.mapCoordinates) <= 1.1 * thread.radius)
	}))
}

const findTiles = raider => Tile.diagonalNeighbors(Tile.closest(raider.mapCoordinates)).map(tile => ({
		mapCoordinates: tile.mapCoordinates,
		canPass: Tile.area(tile, raider.properties.travelType) === Unit.area(raider)
	}))

const interpolateTargets = (targets, weight) => {
	const weightSum = Util.sum(targets.map(weight))

	if (!weightSum) {
		return null
	}

	return LA.multiply(
		1.0 / weightSum,
		targets.reduce((sum, target) => LA.madd(sum, weight(target), target.mapCoordinates), LA.vector())
	)
}

const create = ({ tribe, state, colony }) => {
	const relations = state.relations[colony.owner.referenceId]
	Message.log('starting raid on', colony.name, state.relations[colony.owner.referenceId].colonies[colony.referenceId].raidPlanned)
	const unitPlans = Util.range(state.relations[colony.owner.referenceId].colonies[colony.referenceId].raidPlanned)
		.map(() => GetUnit.create({ owner: tribe.owner, coords: colony.mapCoordinates })).filter(a => !!a)

	if (unitPlans.length > 0) {
		let cancelDisband = []
		return {
			cancel: () => {
				Util.execute(unitPlans.map(plan => plan.cancel))
				Util.execute(cancelDisband)
			},
			dismiss: () => Util.execute(unitPlans.dismiss),
			commit: () => {
				let raiders = []
				let targetTable

				Time.schedule({
					update: (_, deltaTime) => {
						const targets = raiderTargets(relations)
						const threads = raiderThreads()
						createRaiderMap(raiders, targets, threads).forEach(({ raider, targets, threads }) => {
							const targetCoords = interpolateTargets(
								targets,
								target => target.attractivity // Math.pow(0.01 + LA.distance(raider.mapCoordinates, target.mapCoordinates), 2)
							)
							const threadCoords = interpolateTargets(
								threads,
								thread => thread.attractivity // Math.max(0, thread.radius - LA.distance(raider.mapCoordinates, thread.mapCoordinates))
							)

							const tiles = findTiles(raider)
							const terrainCoords = interpolateTargets(
								tiles,
								tile => !tile.canPass && LA.distance(raider.mapCoordinates, tile.mapCoordinates) < 1
									? 1
									: 0
							)

							const targetDirection = targetCoords
								&& LA.subtract(targetCoords, raider.mapCoordinates)
								|| LA.vector()
							const threadDirection =  threadCoords
								&& LA.subtract(threadCoords, raider.mapCoordinates)
								|| LA.vector()
							const terrainDirection = terrainCoords
								&& LA.subtract(terrainCoords, raider.mapCoordinates)
								|| LA.vector()

							const direction = LA.subtract(LA.madd(
								LA.normalize(targetDirection),
								-1.0,
								threadDirection
							), terrainDirection)
							const distance = LA.distance(direction)
							if (distance > 3) {
								const targetTile = Tile.closest(targetCoords)
								if (raider.movement.target !== targetTile) {
									Unit.goTo(raider, targetTile)
								}
							} else if (LA.distance(direction) > 0.1) {
								Unit.goTo(raider, null)
								Move.moveUnit(raider, LA.normalize(direction), deltaTime)
							}
						})

						return state.relations[colony.owner.referenceId].colonies[colony.referenceId].raidPlanned > 0
					},
					priority: true
				})

				return Promise.all(unitPlans.map(plan => new Promise(resolve => {
					plan.commit().then(unit => {
						let unsubscribe
						const cleanup = () => {
							console.log('raid done', unit)
							state.relations[colony.owner.referenceId].colonies[colony.referenceId].raidPlanned -= 1
							if (state.relations[colony.owner.referenceId].colonies[colony.referenceId].raidPlanned < 0) {
								state.relations[colony.owner.referenceId].colonies[colony.referenceId].raidPlanned = 0
							}

							raiders = raiders.filter(r => r !== unit)

							if (!unit.disbanded) {
								Units.unassign(unit)
		
								const disbandAction = Disband.create(unit)
								cancelDisband.push(disbandAction.commit())						
							}

							resolve()
							Util.execute(unsubscribe)
						}

						if (!unit) {
							cleanup()
							return
						}

						raiders.push(unit)

						unsubscribe = [
							// raid when in range
							Events.listen('meet', params => {
								if (params.colony === colony && params.unit === unit) {
									if(Raid(colony, params.unit)) {
										cleanup()
									}
								}
							}),

							// if unit gets too scared it just retreats
							Events.listen('retreat', params => {
								if (params.unit === unit) {
									cleanup()
								}
							})
						]
					})
				})))
			}
		}
	}

	return null
}


export default {
	create
}