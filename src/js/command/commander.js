import Time from 'timeline/time'

import Record from 'util/record'

import Commands from 'command/index'

import InvestigateRumors from 'interaction/investigateRumors'
import EnterSettlement from 'interaction/enterSettlement'


const cancel = () => ({
	update: () => false
})

const scheduleInstead = (commander, command) => {
	commander.commands = [command]
	commander.pleaseStop = false
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
	found: Commands.Found,
	move: Commands.Move,
	moveTo: Commands.MoveTo,
	goTo: Commands.GoTo,
	unload: Commands.Unload,
	load: Commands.Load,
	europe: Commands.Europe,
	cutForest: Commands.CutForest,
	plow: Commands.Plow,
	road: Commands.Road,
	america: Commands.America,
	tradeRoute: Commands.TradeRoute,
	loadCargo: Commands.LoadCargo,
	tradeCargo: Commands.TradeCargo,
	triggerEvent: Commands.TriggerEvent,
	disband: Commands.Disband,
	learnFromNatives: Commands.LearnFromNatives,
	communicateTension: Commands.CommunicateTension,
	commander: Commands.commander
})[type] : {
	load: data => {
		console.warn('cannot load command, missing type', data)
		return {}
	}
})


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