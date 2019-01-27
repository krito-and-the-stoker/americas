import Time from 'timeline/time'

import Record from 'util/record'
import Util from 'util/util'
import Binding from 'util/binding'

import Tile from 'entity/tile'
import MapEntity from 'entity/map'
import Unit from 'entity/unit'

import Commander from 'command/commander'
import MoveTo from 'command/moveTo'
import Disband from 'command/disband'
import LearnFromNatives from 'command/learnFromNatives'

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


const UNIT_PRODUCTION_COST = 10
const create = (tribe, coords, owner) => {
	const settlement = {
		mapCoordinates: coords,
		tribe,
		owner,
		expert: Util.choose(Object.keys(experts)),
		production: UNIT_PRODUCTION_COST * Math.random(),
		productivity: 3 * Math.random(),
	}

	Tile.update.settlement(MapEntity.tile(coords), settlement)

	initialize(settlement)

	Record.add('settlement', settlement)
	return settlement
}

const initialize = settlement => {
	if (settlement.destroy) {
		settlement.destroy()
	}

	settlement.destroy = Util.mergeFunctions([
		Time.schedule(ProduceUnit.create(settlement)),
		listen.production(settlement, production => {
			if (production > UNIT_PRODUCTION_COST) {
				const target = Util.choose(
					Record.getAll('settlement')
						.concat(Record.getAll('colony'))
						.filter(t => {
							const distance = Util.distance(t.mapCoordinates, settlement.mapCoordinates)
							return distance > 0 && distance < 10
						}))
				if (target) {
					const unit = Unit.create('native', settlement.mapCoordinates, settlement.owner)
					Commander.scheduleBehind(unit.commander, MoveTo.create(unit, target.mapCoordinates))
					Commander.scheduleBehind(unit.commander, Disband.create(unit))
				}
				settlement.production -= UNIT_PRODUCTION_COST
			}
		})
	])
}

const dialog = (settlement, unit, answer) => {
	if (answer === 'chief') {
		return {
			text: 'We are always pleased to welcome strangers.',
			type: 'natives'
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
			return {
				text: 'We are delighted to meet a skilled ${unit.name}. Unfortunately, we cannot teach you anything.',
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
			text: 'The natives great you',
			type: 'natives',
			options: [{
				text: 'Leave'
			}]
		}
	}
}


const listen = {
	production: (settlement, fn) => Binding.listen(settlement, 'production', fn)
}

const update = {
	production: (settlement, value) => Binding.update(settlement, 'production', value)
}

const save = settlement => ({
	mapCoordinates: settlement.mapCoordinates,
	tribe: Record.reference(settlement.tribe),
	owner: Record.reference(settlement.owner),
	production: settlement.production,
	productivity: settlement.productivity,
	expert: settlement.expert
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