import Time from 'timeline/time'

import Factory from 'command/factory'

import InvestigateRumors from 'interaction/investigateRumors'
import EnterSettlement from 'interaction/enterSettlement'


const cancel = () => ({
	update: () => false
})

const scheduleInstead = (commander, command) => {
	commander.commands.length = 0
	commander.commands.push(command)
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

const { create, load } = Factory.create('Commander', {
	keep: {
		type: 'raw',
		default: false
	},
	unit: {
		type: 'entity',
	},
	pleaseStop: {
		type: 'raw',
		default: false
	},
	commands: {
		type: 'commands',
		default: []
	},
	currentCommand: {
		type: 'command',
	}
}, ({ keep, unit, commands, currentCommand }) => {
	let unschedule = null
	const commander = {
		commands,
		priority: true,
		currentCommand
	}

	// TODO: this does not belong here!
	let done = {
		investigateRumors: false,
		enterSettlement: false
	}

	commander.init = () => ({
		keep,
		unit,
		commands,
		currentCommand
	})

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

	return commander
})


export default {
	create,
	load,
	cancel,
	scheduleInstead,
	scheduleBehind,
	isIdle,
	commandsScheduled,
	clearSchedule
}