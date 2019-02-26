import Record from 'util/record'
import Util from 'util/util'
import Binding from 'util/binding'

import Tile from 'entity/tile'
import MapEntity from 'entity/map'
import Unit from 'entity/unit'
import Treasure from 'entity/treasure'
import Tribe from 'entity/tribe'

import Commander from 'command/commander'
import LearnFromNatives from 'command/learnFromNatives'


const experts = {
	farmer: 'Expert Farmer',
	sugarplanter: 'Expert Sugarplanter',
	tobaccoplanter: 'Expert Tobaccoplanter',
	cottonplanter: 'Expert Cottonplanter',
	furtrapper: 'Expert Furtrapper',
	lumberjack: 'Expert Lumberjack',
	oreminer: 'Expert Oreminer',
	silverminer: 'Expert Silverminer',
	fisher: 'Expert Fisher',
}

const create = (tribe, coords, owner) => {
	const settlement = {
		mapCoordinates: coords,
		tribe,
		owner,
		presentGiven: false,
		hasLearned: false,
		expert: Util.choose(Object.keys(experts)),
		mission: false,
		population: Math.round(10*Math.random())
	}

	Tile.update.settlement(MapEntity.tile(coords), settlement)
	Tile.radius(MapEntity.tile(coords))
		.forEach(tile => Tile.discover(tile, owner))

	Tile.radius(MapEntity.tile(coords))
		.filter(tile => tile.domain === 'land')
		.forEach(tile => Tile.update.harvestedBy(tile, settlement))


	initialize(settlement)

	Record.add('settlement', settlement)
	return settlement
}


const initialize = settlement => {
	Util.execute(settlement.destroy)
	settlement.type = 'settlement'

	settlement.destroy = [
		Tribe.add.settlement(settlement.tribe, settlement),
	]
}

const dialog = (settlement, unit, answer) => {
	if (answer === 'mission') {
		return {
			text: 'The natives come to your mission with curiousity.',
			type: 'religion',
			options: [{
				default: true,			
				action: () => {
					update.mission(settlement, true)
					Unit.disband(unit)
				}
			}]
		}
	}
	if (answer === 'chief') {
		const welcomeText = `Welcome stranger! We are well known for our ${experts[settlement.expert]}.`
		const choice = Math.random()
		if (settlement.presentGiven || choice < 0.3) {		
			return {
				text: `${welcomeText} We are always pleased to welcome English travelers.`,
				type: 'natives',
				image: settlement.tribe.image,
			}
		}
		if (choice < 0.8) {
			return {
				text: `${welcomeText} Come sit by the fire and we tell you about nearby lands.`,
				type: 'natives',
				image: settlement.tribe.image,
				options: [{
					default: true,
					action: () => {
						settlement.presentGiven = true
						const radius = Math.round(3 + 3 * Math.random())
						const tiles = Util.quantizedRadius(unit.mapCoordinates, radius).map(MapEntity.tile)
						tiles.forEach(tile => {
							if (Math.random() > 0.4) {
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
			image: settlement.tribe.image,
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
			image: settlement.tribe.image,
			options: [{
				default: true,
				action: () => {
					settlement.hasLearned = true
					Commander.scheduleInstead(unit.commander, LearnFromNatives.create({ unit, profession: settlement.expert }))
				}
			}]
		}
	}
	if (answer === 'tribute') {
		return {
			text: 'We will not pay you tribute!',
			type: 'natives',
			image: settlement.tribe.image,
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
						text: 'We have already shared our knowledge with you. Now go your way and spread it amongst your people.',
						type: 'natives',
						image: settlement.tribe.image,
						options: [{
							text: 'Leave'
						}]
					}
				}
				const expert = experts[settlement.expert]
				return {
					text: `You seem unskilled and do not understand the way of the nature around you. We invite you to live among us and we will teach you to be a ${expert}.`,
					type: 'natives',
					image: settlement.tribe.image,
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
					image: settlement.tribe.image,
					options: [{
						text: 'Leave'
					}]
				}
			}
			if (unit.expert === settlement.expert) {
				return {
					text: `Fare well fellow ${experts[settlement.expert]}.`,
					type: 'natives',
					image: settlement.tribe.image,
					options: [{
						text: 'Leave'
					}]
				}
			}
			return {
				text: 'You are skilled and already know your way. We cannot teach you anything.',
				type: 'natives',
				image: settlement.tribe.image,
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
				text: 'We cannot attack the native settlements yet.',
				type: 'marshal',
				options: [{
					text: 'Leave'
				}]
			}
		}
		if (unit.name === 'missionary') {
			return {
				text: 'The native watch you curiously when you enter the settlement',
				type: 'religion',
				options: [{
					text: 'Establish mission',
					answer: 'mission'
				}, {
					text: 'Leave'
				}]
			}
		}
		return {
			text: 'The natives greet you.',
			type: 'natives',
			image: settlement.tribe.image,
			options: [{
				text: 'Leave'
			}]
		}
	}
}


const listen = {
	mission: (settlement, fn) => Binding.listen(settlement, 'mission', fn),
}

const update = {
	mission: (settlement, value) => Binding.update(settlement, 'mission', value),
}

const save = settlement => ({
	mapCoordinates: settlement.mapCoordinates,
	tribe: Record.reference(settlement.tribe),
	owner: Record.reference(settlement.owner),
	expert: settlement.expert,
	presentGiven: settlement.presentGiven,
	hasLearned: settlement.hasLearned,
	mission: settlement.mission,
	population: settlement.population
})

const load = settlement => {
	settlement.tribe = Record.dereference(settlement.tribe)
	settlement.owner = Record.dereference(settlement.owner)
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