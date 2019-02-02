import Found from 'command/found'
import Move from 'command/move'
import MoveTo from 'command/moveTo'
import Unload from 'command/unload'
import Load from 'command/load'
import Europe from 'command/europe'
import America from 'command/america'
import CutForest from 'command/cutForest'
import LoadCargo from 'command/loadCargo'
import TradeRoute from 'command/tradeRoute'
import TriggerEvent from 'command/triggerEvent'
import Disband from 'command/disband'
import Plow from 'command/plow'
import Road from 'command/road'
import LearnFromNatives from 'command/learnFromNatives'
import CommunicateTension from 'command/communicateTension'

import InvestigateRumors from 'interaction/investigateRumors'
import EnterSettlement from 'interaction/enterSettlement'

import Time from 'timeline/time'

import Record from 'util/record'


const cancel = () => ({
	update: () => false
})

const scheduleInstead = (commander, command) => {
	commander.commands = [command]
	if (commander.currentCommand) {
		clearSchedule(commander.currentCommand)
	}
}

const isIdle = commander => !commander.currentCommand && commander.commands.length === 0

const scheduleBehind = (commander, command) => {
	commander.commands.push(command)
}

const clearSchedule = commander => {
	commander.pleaseStop = true
}

const commandsScheduled = command => {
	const current = command.currentCommand ? commandsScheduled(command.currentCommand) : 1
	const other = command.commands ? command.commands.map(commandsScheduled).reduce((sum, count) => sum + count, 0) : 0

	return current + other
}

const create = (args = {}) => {
	const keep = args.keep || false
	const unit = args.unit || null
	const commands = args.commands || []
	let unschedule = null
	const commander = {
		commands,
		priority: true,
		currentCommand: null
	}

	let done = {
		investigateRumors: false,
		enterSettlement: false
	}

	commander.init = () => !commander.pleaseStop

	commander.update = () => {
		if (commander.pleaseStop) {
			commander.commands.forEach(command => command.canceled ? command.canceled() : null)
			commander.commands = []
			if (commander.currentCommand) {
				commander.currentCommand.pleaseStop = true
			}
			commander.pleaseStop = false
		}
		if (!commander.currentCommand && commander.commands.length > 0) {
			commander.currentCommand = commander.commands.shift()
			const originalFinished = commander.currentCommand.finished
			commander.currentCommand.finished = () => {
				if (originalFinished) {
					originalFinished()
				}
				commander.currentCommand = null
			}
			unschedule = Time.schedule(commander.currentCommand)

			done.investigateRumors = false
			done.enterSettlement = false
		}

		if (unit && !commander.currentCommand && commander.commands.length === 0) {
			if (unit.owner.input && unit.tile.rumors && !done.investigateRumors) {
				done.investigateRumors = true
				InvestigateRumors(unit)
			}

			if (unit.owner.input && unit.tile.settlement && !done.enterSettlement) {
				done.enterSettlement = true
				EnterSettlement(unit.tile.settlement, unit)
			}			
		}

		return keep || commander.currentCommand || commander.commands.length > 0
	}

	commander.stopped = () => {
		if (commander.currentCommand) {
			if (unschedule) {
				unschedule()
			}
		}
	}

	commander.save = () => ({
		commands: commander.commands.map(command => command.save()),
		currentCommand: commander.currentCommand ? commander.currentCommand.save() : null,
		type: 'commander',
		keep,
		unit: Record.reference(unit),
	})

	return commander
}

const getModule = type => ( type ? ({
	found: Found,
	move: Move,
	moveTo: MoveTo,
	unload: Unload,
	load: Load,
	europe: Europe,
	cutForest: CutForest,
	plow: Plow,
	road: Road,
	america: America,
	tradeRoute: TradeRoute,
	loadCargo: LoadCargo,
	triggerEvent: TriggerEvent,
	disband: Disband,
	learnFromNatives: LearnFromNatives,
	communicateTension: CommunicateTension,
	commander: { load }
})[type] : { load: data => console.warn('cannot load command, missing type', data) }) 


const load = data => {
	const commands = (data.currentCommand ? [data.currentCommand, ...data.commands] : data.commands).map(cmd => getModule(cmd.type).load(cmd))
	const unit = Record.dereference(data.unit)
	return create({ keep: data.keep, commands, unit })
}

export default {
	create,
	load,
	getModule,
	cancel,
	scheduleInstead,
	scheduleBehind,
	isIdle,
	commandsScheduled,
	clearSchedule
}