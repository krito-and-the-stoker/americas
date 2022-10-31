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
		attractivity: 2.0 * colony.colonists.length
	})).concat(Record.getAll('unit').filter(unit => !unit.owner.ai
		&& !unit.colony
		&& unit.domain === 'land'
		&& !unit.combat
		&& !unit.canAttack).map(unit => ({
			mapCoordinates: unit.mapCoordinates,
			attractivity: 1.0 + 0.01 * (unit.properties.cargo || 0)
		})))

const raiderThreads = () => Record.getAll('unit')
	.filter(unit => !unit.owner.ai
		&& !isColonistInColony(unit)
		&& !unit.offTheMap
		&& unit.domain === 'land'
		&& unit.properties.canAttack)
	.map(unit => ({
		mapCoordinates: unit.mapCoordinates,
		attractivity: Unit.strength(unit),
		radius: 0.5 * unit.radius,
	}))

const distanceSort = base => (a, b) =>
	LA.distance(base.mapCoordinates, a.mapCoordinates) - LA.distance(base.mapCoordinates, b.mapCoordinates)
const createRaiderMap = (raiders, targets, threads) => {
	const map = raiders.map(raider => ({
		raider,
		targets: [],
		threads: []
	}))

	const totalAttraction = Util.sum(targets.map(target => target.attractivity))
	const relativeAttraction = totalAttraction / raiders.length
	targets.forEach(target => {
		let attraction = target.attractivity
		raiders.sort(distanceSort(target))
			.forEach(unit => {
				if (attraction > 0) {
					map.find(({ raider }) => raider === unit).targets.push({
						mapCoordinates: target.mapCoordinates,
						attractivity: attraction
					})
					attraction -= relativeAttraction
				}
			})
	})

	threads.forEach(thread => {
		let attraction = thread.attractivity
		raiders.filter(raider => LA.distance(thread.mapCoordinates, raider.mapCoordinates) <= 1.25 * thread.radius)
			.sort(distanceSort(thread))
			.forEach(unit => {
				attraction -= Unit.strength(unit) * unit.radius / unit.properties.radius
				if (attraction > 0) {
					map.find(({ raider }) => raider === unit).threads.push({
						mapCoordinates: thread.mapCoordinates,
						attractivity: attraction
					})
				}
			})
	})

	window.raiderMap = map
	window.threads = threads
	window.totalAttraction = totalAttraction
	window.relativeAttraction = relativeAttraction
	window.raiders = raiders

	return map
}

const raiderFriends = raider => Record.getAll('unit')
	.filter(unit => raider !== unit
		&& !!unit.owner.ai
		&& LA.distance(raider.mapCoordinates, unit.mapCoordinates) < 2)
	.map(unit => ({
		mapCoordinates: unit.mapCoordinates,
		attractivity: 1
	}))

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
					init: () => {
						Message.log('starting raid on', colony.name, state.relations[colony.owner.referenceId].colonies[colony.referenceId].raidPlanned)
						return true
					},
					update: (_, deltaTime) => {
						const targets = raiderTargets(relations)
						const threads = raiderThreads()
						createRaiderMap(raiders, targets, threads).forEach(({ raider, targets, threads }) => {
							const targetCoords = interpolateTargets(
								targets,
								target => target.attractivity
							)
							const threadCoords = interpolateTargets(
								threads,
								thread => thread.attractivity
							)

							const tiles = findTiles(raider)
							const terrainCoords = interpolateTargets(
								tiles,
								tile => !tile.canPass && LA.distance(raider.mapCoordinates, tile.mapCoordinates) < 1
									? 1
									: 0
							)

							const friends = raiderFriends(raider)
							const friendsCoords = interpolateTargets(
								friends,
								friend => friend.attractivity
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
							const friendsDirection = friendsCoords
								&& LA.subtract(friendsCoords, raider.mapCoordinates)
								|| LA.vector()

							const direction = LA.vectorProduct([
								1,
								-1,
								-1,
								-0.3
							], LA.normalize(targetDirection),
							threadDirection,
							terrainDirection,
							friendsDirection)

							const distance = LA.distance(direction)
							if (!threadCoords && !friendsCoords) {
								const targetTile = Tile.closest(targetCoords)
								if (raider.movement.target !== targetTile) {
									Unit.goTo(raider, targetTile)
								}
							} else if (LA.distance(direction) > 0.05) {
								Unit.goTo(raider, null)
								Move.moveUnit(raider, LA.normalize(direction), deltaTime)
							}
						})

						return state.relations[colony.owner.referenceId].colonies[colony.referenceId].raidPlanned > 0
					},
					finished: () => {
						Message.log('Raid is over', colony.name, state.relations[colony.owner.referenceId].colonies[colony.referenceId].raidPlanned)
					},
					priority: true
				})

				return Promise.all(unitPlans.map(plan => new Promise(resolve => {
					plan.commit().then(unit => {
						let unsubscribe
						const cleanup = () => {
							console.log('going home', unit)
							state.relations[colony.owner.referenceId].colonies[colony.referenceId].raidPlanned -= 1
							if (state.relations[colony.owner.referenceId].colonies[colony.referenceId].raidPlanned < 0) {
								state.relations[colony.owner.referenceId].colonies[colony.referenceId].raidPlanned = 0
							}

							raiders = raiders.filter(r => r !== unit)
							Units.unassign(unit)

							if (!unit.disbanded) {
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
										console.log('raided', colony)
										cleanup()
									}
								}
							}),

							// if unit gets too scared it just retreats
							Events.listen('retreat', params => {
								if (params.unit === unit) {
									console.log('retreating', unit)
									cleanup()
								}
							}),

							Events.listen('combat', params => {
								if (params.loser === unit) {
									console.log('defeated', unit)
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