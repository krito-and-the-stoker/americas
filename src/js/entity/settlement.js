import Time from 'timeline/time'

import Record from 'util/record'
import Util from 'util/util'
import Binding from 'util/binding'

import Tile from 'entity/tile'
import MapEntity from 'entity/map'
import Unit from 'entity/unit'
import Treasure from 'entity/treasure'

import Commander from 'command/commander'
import MoveTo from 'command/moveTo'
import Disband from 'command/disband'
import LearnFromNatives from 'command/learnFromNatives'
import CommunicateTension from 'command/communicateTension'

import ProduceUnit from 'task/produceUnit'

const experts = {
	farmer: "Expert Farmer",
	sugarplanter: "Expert Sugarplanter",
	tobaccoplanter: "Expert Tobaccoplanter",
	cottonplanter: "Expert Cottonplanter",
	furtrapper: "Expert Furtrapper",
	lumberjack: "Expert Lumberjack",
	oreminer: "Expert Oreminer",
	silverminer: "Expert Silverminer",
	fisher: "Expert Fisher",
}

const INTEREST_GROWTH_FACTOR = 1.0 / Time.PRODUCTION_BASE_TIME
const TENSION_GROWTH_FACTOR = 1.0 / Time.PRODUCTION_BASE_TIME
const create = (tribe, coords, owner) => {
	const settlement = {
		mapCoordinates: coords,
		tribe,
		owner,
		presentGiven: false,
		hasLearned: false,
		expert: Util.choose(Object.keys(experts)),
		interest: 5 * Math.random(),
		tension: 0,
		colonies: []
	}

	Tile.update.settlement(MapEntity.tile(coords), settlement)
	Tile.radius(MapEntity.tile(coords)).forEach(tile => Tile.discover(tile, owner))

	initialize(settlement)

	Record.add('settlement', settlement)
	return settlement
}

const watchColony = (colony, settlement) => {
	const distance = Util.distance(colony.mapCoordinates, settlement.mapCoordinates)
	if (Util.distance(colony.mapCoordinates, settlement.mapCoordinates) < 5) {
		return Util.mergeFunctions([
			Time.schedule({ update: (currentTime, deltaTime) => {
				// grow interest
				update.interest(settlement, settlement.interest + INTEREST_GROWTH_FACTOR * deltaTime / distance)
				return true
			}}),
			Util.mergeFunctions(Util.quantizedRadius(settlement.mapCoordinates, 4).map(coords => {
				const tileDistance = Util.distance(settlement.mapCoordinates, coords)
				return Tile.listen.tile(MapEntity.tile(coords), tile =>
					(tile.road || tile.plowed) ? Time.schedule({ update: (currentTime, deltaTime) => {
						// grow tension
						const scale = deltaTime * TENSION_GROWTH_FACTOR
						update.tension(settlement, settlement.tension + scale * ((tile.road ? 1:0) + (tile.plowed ? 1:0)) / tileDistance)
						return true
					}}) : null)
			}))
		])
	}
}

const initialize = settlement => {
	if (settlement.destroy) {
		settlement.destroy()
	}

	settlement.destroy = Util.mergeFunctions([
		listen.interest(settlement, interest => {
			if (interest > 5) {
				update.interest(settlement, interest - 5)
				const colony = Util.choose(settlement.colonies)
				const unit = Unit.create('native', settlement.mapCoordinates, settlement.owner)
				Commander.scheduleInstead(unit.commander, MoveTo.create(unit, colony.mapCoordinates))
				Commander.scheduleBehind(unit.commander, CommunicateTension.create(colony, settlement, unit))
				Commander.scheduleBehind(unit.commander, MoveTo.create(unit, settlement.mapCoordinates))
				Commander.scheduleBehind(unit.commander, Disband.create(unit))
			}
		}),
		Record.listen('colony', colony => {
			settlement.colonies.push(colony)
			return watchColony(colony, settlement)
		}),
		Util.mergeFunctions(settlement.colonies.map(colony => watchColony(colony, settlement)))
	])
}

const dialog = (settlement, unit, answer) => {
	if (answer === 'chief') {
		const welcomeText = `Welcome stranger! We are well known for our ${experts[settlement.expert]}.`
		if (settlement.presentGiven) {		
			return {
				text: `${welcomeText} We are always pleased to welcome English travelers.`,
				type: 'natives'
			}
		}
		const choice = Math.random()
		if (choice < 0.65) {
			return {
				text: `${welcomeText} Come sit by the fire and we tell you about nearby lands.`,
				type: 'natives',
				options: [{
					default: true,
					action: () => {
						settlement.presentGiven = true
						const radius = Math.round(7 + 5 * Math.random())
						// console.log(radius, unit.mapCoordinates, Util.quantizedRadius(unit.mapCoordinates, radius))
						const tiles = Util.quantizedRadius(unit.mapCoordinates, radius).map(MapEntity.tile)
						tiles.forEach(tile => {
							if (Math.random() > 0.35) {
								Tile.discover(tile, unit.owner)
							}
						})
					}
				}]
			}
		}
		const worth = Math.round(50 + 200*Math.random())
		return {
			text: `${welcomeText} Have these valuable beads (${worth}) as our gift.`,
			type: 'natives',
			options: [{
				default: true,
				action: () => {
					settlement.presentGiven = true
					Treasure.gain(worth)
				}
			}]
		}
	}
	if (answer === 'live') {
		return {
			text: 'We gladly welcome you in our settlement.',
			type: 'natives',
			options: [{
				default: true,
				action: () => Commander.scheduleInstead(unit.commander, LearnFromNatives.create(unit, settlement.expert))
			}]
		}
	}
	if (answer === 'tribute') {
		return {
			text: 'We will not pay you tribute!',
			type: 'natives'
		}
	}
	if (answer === 'enter') {	
		if (unit.name === 'scout') {
			return {
				text: 'The natives watch you curious as you enter the settlement.',
				type: 'scout',
				options: [{
					text: 'Ask to speek with the chief',
					answer: 'chief'
				}, {
					text: 'Demand tribute'
				}, {
					text: 'Leave'
				}]
			}
		}
		if (unit.name === 'settler') {
			if (!unit.expert || unit.expert === 'servant') {
				if (settlement.hasLearned) {
					return {
						text: `We have already shared our knowledge with you. Now go your way and spread it amongst your people.`,
						type: 'natives',
						options: [{
							text: 'Leave'
						}]
					}
				}
				const expert = experts[settlement.expert]
				return {
					text: `You seem unskilled and do not understand the way of the nature around you. We invite you to live among us and we will teach you to be a ${expert}.`,
					type: 'natives',
					options: [{
						text: 'Live among the natives',
						answer: 'live'
					}, {
						text: 'Leave'
					}]
				}
			}
			if (unit.expert === 'criminal') {
				return {			
					text: 'You are unskilled and your manners insult our patience. We do not believe we can teach you anything.',
					type: 'natives',
					options: [{
						text: 'Leave'
					}]
				}
			}
			if (unit.expert === settlement.expert) {
				return {
					text: `Fare well fellow ${experts[settlement.expert]}.`,
					type: 'natives',
					options: [{
						text: 'Leave'
					}]
				}
			}
			return {
				text: `You are skilled and already know your way. We cannot teach you anything.`,
				type: 'natives',
				options: [{
					text: 'Leave'
				}]
			}
		}
		if (unit.name === 'wagontrain') {
			return {
				text: 'It is not yet possible to trade with the indians.',
				type: 'govenor',
				options: [{
					text: 'Leave'
				}]
			}
		}
		if (unit.name === 'artillery' || unit.name === 'soldier' || unit.name === 'dragoon') {
			return {
				text: 'We cannot attack the natives yet.',
				type: 'marshal',
				options: [{
					text: 'Leave'
				}]
			}
		}
		return {
			text: 'The natives greet you.',
			type: 'natives',
			options: [{
				text: 'Leave'
			}]
		}
	}
}


const listen = {
	interest: (settlement, fn) => Binding.listen(settlement, 'interest', fn),
	tension: (settlement, fn) => Binding.listen(settlement, 'tension', fn),
}

const update = {
	interest: (settlement, value) => Binding.update(settlement, 'interest', value),
	tension: (settlement, value) => Binding.update(settlement, 'tension', value),
}

const save = settlement => ({
	mapCoordinates: settlement.mapCoordinates,
	tribe: Record.reference(settlement.tribe),
	owner: Record.reference(settlement.owner),
	expert: settlement.expert,
	presentGiven: settlement.presentGiven,
	hasLearned: settlement.hasLearned,
	interest: settlement.interest,
	tension: settlement.tension,
	colonies: settlement.colonies.map(Record.reference)
})

const load = settlement => {
	settlement.tribe = Record.dereference(settlement.tribe)
	settlement.owner = Record.dereference(settlement.owner)
	settlement.colonies = settlement.colonies.map(Record.dereference)
	Tile.update.settlement(MapEntity.tile(settlement.mapCoordinates), settlement)

	Record.entitiesLoaded(() => initialize(settlement))
	return settlement
}

export default {
	create,
	listen,
	update,
	load,
	save,
	dialog
}