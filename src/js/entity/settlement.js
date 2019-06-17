import Record from 'util/record'
import Util from 'util/util'
import Binding from 'util/binding'

import Time from 'timeline/time'

import Tile from 'entity/tile'
import MapEntity from 'entity/map'
import Unit from 'entity/unit'
import Treasure from 'entity/treasure'
import Tribe from 'entity/tribe'
import Storage from 'entity/storage'

import Commander from 'command/commander'
import LearnFromNatives from 'command/learnFromNatives'

import Bombard from 'interaction/bombard'

import Natives from 'ai/natives'


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
		lastTaxation: 0,
		expert: Util.choose(Object.keys(experts)),
		mission: false,
		population: Math.ceil(tribe.civilizationLevel * (1 + 3*Math.random()))
	}

	Tile.radius(MapEntity.tile(coords))
		.forEach(tile => Tile.discover(tile, owner))

	Tile.radius(MapEntity.tile(coords))
		.filter(tile => tile.domain === 'land')
		.forEach(tile => Tile.update.harvestedBy(tile, settlement))


	initialize(settlement)

	Record.add('settlement', settlement)
	return settlement
}

const disband = settlement => {
	const center = MapEntity.tile(settlement.mapCoordinates)
	Tile.update.settlement(center, null)
	Tile.radius(center)
		.filter(tile => tile.domain === 'land')
		.filter(tile => tile.harvestedBy === settlement)
		.forEach(tile => Tile.update.harvestedBy(tile, null))

	Util.execute(settlement.destroy)
	Record.remove(settlement)
}

const initialize = settlement => {
	Tile.update.settlement(MapEntity.tile(settlement.mapCoordinates), settlement)
	Util.execute(settlement.destroy)
	settlement.type = 'settlement'

	settlement.destroy = [
		Tribe.add.settlement(settlement.tribe, settlement),
	]
}


const dialog = (settlement, unit, answer) => {
	const relations = settlement.owner.ai.state.relations[unit.owner.referenceId]
	if (answer === 'food') {
		if (settlement.lastTaxation > Time.get().currentTime - Time.YEAR) {
			return {
				text: 'We have already given you all we have. We cannot give you anything more this year',
				type: 'natives',
				image: settlement.tribe.image,
				options: [{
					text: 'So this is how you help out...'
				}]
			}
		}

		relations.trust -= .05
		relations.militancy += .1
		settlement.lastTaxation = Time.get().currentTime
		const amount = Math.round(settlement.population * (1 + 2 * Math.random()))
		return {
			text: `We do not really have a surplus, but take these ${amount} food if you must.`,
			type: 'natives',
			image: settlement.tribe.image,
			options: [{
				default: true,
				action: () => {
					Storage.update(unit.equipment, { good: 'food', amount })
				}
			}]
		}
	}
	if (answer === 'tribute') {
		if (settlement.lastTaxation > Time.get().currentTime - Time.YEAR) {
			return {
				text: 'We have already given you and will not submit to these demands.',
				type: 'natives',
				image: settlement.tribe.image,
				options: [{
					text: 'Fine. But we will come back next year.'
				}]
			}
		}

		let good = null
		if (settlement.tribe.civilizationLevel < 3) {
			good = Util.choose(['food', 'furs', 'tobacco', 'food', 'furs', 'tobacco', 'coats', 'cloth'])
		}
		if (!good && settlement.tribe.civilizationLevel < 6) {
			good = Util.choose(['food', 'furs', 'tobacco', 'sugar', 'cotton', 'coats', 'cloth'])
		}
		if (!good) {
			good = Util.choose(['food', 'tobacco', 'sugar', 'cotton', 'coats', 'cloth', 'silver', 'coats', 'cloth', 'silver'])
		}
		const amount = Math.round(settlement.population * (1 + 3 * Math.random()))
		settlement.lastTaxation = Time.get().currentTime
		settlement.owner.ai.state.relations[unit.owner.referenceId].trust -= .1
		settlement.owner.ai.state.relations[unit.owner.referenceId].militancy += .1

		return {
			text: `So be it then, take these ${amount} ${good}.`,
			type: 'natives',
			image: settlement.tribe.image,
			options: [{
				default: true,
				action: () => {
					Storage.update(unit.equipment, { good, amount })
				}
			}]
		}
	}
	if (answer === 'mission') {
		if (relations.militancy > 0.2 && 0.4*Math.random() >= relations.trust) {
			return {
				text: 'Your missionary was unable to establish friendly contact with the natives and has vanished.',
				type: 'religion',
				options: [{
					default: true,
					action: () => {
						Unit.disband(unit)
					}
				}]
			}
		}

		const description = relations.trust > 0 ? 'with curiousity' : 'cautiously'
		return {
			text: `The natives join your mission ${description}.`,
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
		if (relations.militancy > 0.1 && 0.8*Math.random() >= relations.trust) {
			return {
				text: 'Your people have been untrustworthy and reckless against us. We will use you for target practice.',
				type: 'natives',
				image: settlement.tribe.image,
				options: [{
					default: true,
					action: () => {
						Unit.disband(unit)
					}
				}]
			}
		}
		if (settlement.presentGiven || choice < 0.3) {
			settlement.presentGiven = true
			return {
				text: `${welcomeText} We are always pleased to welcome English travelers.`,
				type: 'natives',
				image: settlement.tribe.image,
			}
		}
		if ( choice < 0.8) {
			return {
				text: `${welcomeText} Come sit by the fire and we tell you about nearby lands.`,
				type: 'natives',
				image: settlement.tribe.image,
				options: [{
					default: true,
					action: () => {
						settlement.presentGiven = true
						const radius = Math.round(4 * (1 + Math.random()))
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
		const worth = Math.round(settlement.tribe.civilizationLevel * settlement.population * (1 + 3*Math.random()))
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
		if (Math.random() < relations.militancy && Math.random() >= relations.trust) {
			return {
				text: 'How dare you asking for our help when you brought so much misery to our people. Prepare to die for your foolishness.',
				type: 'natives',
				image: settlement.tribe.image,
				options: [{
					default: true,
					action: () => {
						Unit.disband(unit)
					}
				}]
			}
		}
		if (relations.trust < 0.4) {
			return {
				text: 'We do not feel comfortable around your people at this time. Please leave.',
				type: 'natives',
				image: settlement.tribe.image,
			}
		}
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
	if (answer === 'enter') {	
		if (unit.name === 'scout') {
			const description = Natives.describeRelations(relations)
			return {
				text: `The natives are ${description} as you approach their settlement.`,
				type: 'scout',
				options: [{
					text: 'Ask to speek with the chief',
					answer: 'chief'
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
		if (unit.name === 'artillery') {
			return {
				text: 'Do you want to bombard the settlement?',
				type: 'marshal',
				options: [{
					text: 'Fire!',
					action: () => {
						Bombard(settlement, unit)
					}
				}, {
					text: 'No, spare these people.'
				}]
			}
		}
		if (unit.name === 'soldier' || unit.name === 'dragoon') {
			return {
				text: 'Our soldiers are ready for orders close to the native settlement.',
				type: 'marshal',
				options: [{
					text: 'Demand food supplies',
					answer: 'food'
				}, {
					text: 'Demand tribute',
					answer: 'tribute'
				}, {
					text: 'Leave'
				}]
			}
		}
		if (unit.name === 'missionary') {
			const description = Natives.describeRelations(relations)
			return {
				text: `The natives are ${description} as you approach their settlement.`,
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
	population: settlement.population,
	lastTaxation: settlement.lastTaxation
})

const load = settlement => {
	settlement.tribe = Record.dereference(settlement.tribe)
	settlement.owner = Record.dereference(settlement.owner)

	Record.entitiesLoaded(() => initialize(settlement))
	return settlement
}

export default {
	create,
	disband,
	listen,
	update,
	load,
	save,
	dialog
}