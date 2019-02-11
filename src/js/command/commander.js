import Time from 'timeline/time'

import Factory from 'command/factory'

import InvestigateRumors from 'interaction/investigateRumors'
import EnterSettlement from 'interaction/enterSettlement'


const cancel = () => ({
	update: () => false
})

const scheduleInstead = (commander, command) => {
	commander.schedule.instead(command)
}

const isIdle = commander => !commander.currentCommand && commander.commands.length === 0

const scheduleBehind = (commander, command) => {
	commander.schedule.behind(command)
}

const clearSchedule = commander => {
	commander.schedule.stop()
}

const commandsScheduled = command => {
	console.warn('probably not working')
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
	// TODO: this does not belong here!
	let done = {
		investigateRumors: false,
		enterSettlement: false
	}

	const schedule = {
		instead: command => {
			console.log('new schedule', schedule.tag, unit && unit.referenceId)
			commands.length = 0
			commands.push(command)
			if (schedule.currentCommand && schedule.currentCommand.schedule) {
				schedule.currentCommand.schedule.stop()
			}
		},
		behind: command => {
			commands.push(command)
		},
		clear: () => {
			console.log('clear schedule', schedule.tag)
			if (schedule.currentCommand && schedule.currentCommand.schedule ) {
				schedule.currentCommand.schedule.stop()
			}
		},
		stop: () => {
			pleaseStop = true
		},
		currentCommand,
		tag: Math.random()
	}

	const init = () => ({
		keep,
		unit,
		commands,
		currentCommand
	})

	let pleaseStop = false

	const update = () => {
		console.log(schedule.tag, commands.length)
		if (pleaseStop) {
			commands.forEach(command => command.canceled ? command.canceled() : null)
			commands.length = 0
			if (schedule.currentCommand && schedule.currentCommand.schedule) {
				schedule.currentCommand.schedule.stop()
			}
			pleaseStop = false
		}
		if (!schedule.currentCommand && commands.length > 0) {
			schedule.currentCommand = commands.shift()
			const originalFinished = schedule.currentCommand.finished
			schedule.currentCommand.finished = () => {
				if (originalFinished) {
					originalFinished()
				}
				schedule.currentCommand = null
			}
			unschedule = Time.schedule(schedule.currentCommand)

			done.investigateRumors = false
			done.enterSettlement = false
		}

		if (unit && !schedule.currentCommand && commands.length === 0) {
			if (unit.owner.input && unit.tile.rumors && !done.investigateRumors) {
				done.investigateRumors = true
				InvestigateRumors(unit)
			}

			if (unit.owner.input && unit.tile.settlement && !done.enterSettlement) {
				done.enterSettlement = true
				EnterSettlement(unit.tile.settlement, unit)
			}			
		}

		return keep || schedule.currentCommand || commands.length > 0
	}

	const stopped = () => {
		if (schedule.currentCommand) {
			if (unschedule) {
				unschedule()
			}
		}
	}

	return {
		priority: true,
		init,
		update,
		stopped,
		schedule
	}
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