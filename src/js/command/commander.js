import Time from 'timeline/time'

import Factory from 'command/factory'

import InvestigateRumors from 'interaction/investigateRumors'
import EnterSettlement from 'interaction/enterSettlement'


const cancel = () => ({
	update: () => false
})

const scheduleInstead = (commander, command) => {
	schedule.instead(commander, command)
}

const isIdle = commander => false //!commander.currentCommand && commander.commands.length === 0

const scheduleBehind = (commander, command) => {
	schedule.behind(commander, command)
}

const clearSchedule = commander => {
	schedule.clear(commander)
}

const schedule = {
	instead: (parent, child) => {
		// console.log(`scheduling ${child.tag} into ${parent.tag}`)
		schedule.clear(parent)
		schedule.behind(parent, child)
		// console.log(parent.tag, 'commands', parent.state.commands)
	},
	behind: (parent, child) => {
		parent.state.commands.push(child)
	},
	clear: (parent) => {
		// console.log('clearing', parent.tag)
		parent.state.commands.forEach(cmd => cmd.canceled ? cmd.canceled() : null)
		parent.state.commands.length = 0
		if (parent.state.currentCommand && parent.state.currentCommand.state) {
			schedule.clear(parent.state.currentCommand)
		}
	},
	// printTree: (indentation = 0) => {
	// 	const spaces = Util.range(indentation + 2).map(() => '.').join('')
	// 	if (!indentation) {
	// 		console.log('tree of', tag)
	// 	}

	// 	const all = [schedule.currentCommand].concat(schedule.commands)
	// 	all.filter(cmd => !!cmd).forEach(cmd => {
	// 		if (cmd.schedule) {
	// 			console.log(spaces, cmd.tag)
	// 			if (cmd.schedule !== schedule) {
	// 				cmd.schedule.printTree(indentation + 2)
	// 			} else {
	// 				console.log(schedule.currentCommand)
	// 				console.log(schedule.commands)
	// 			}
	// 		} else {
	// 			console.log(spaces, cmd.tag)
	// 		}
	// 	})
	// },
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
	commands: {
		type: 'commands',
		default: []
	},
	currentCommand: {
		type: 'command',
	}
}, (state) => {
	const { keep, unit, tag } = state
	let unschedule = null
	// TODO: this does not belong here!
	let done = {
		investigateRumors: false,
		enterSettlement: false
	}

	const update = () => {
		// console.log(tag, state.currentCommand && state.currentCommand.tag, state.commands.map(cmd => cmd.tag))
		if (!state.currentCommand && state.commands.length > 0) {
			state.currentCommand = state.commands.shift()
			
			const originalFinished = state.currentCommand.finished
			state.currentCommand.finished = () => {
				if (originalFinished) {
					originalFinished()
				}
				state.currentCommand = null
			}
			unschedule = Time.schedule(state.currentCommand)

			done.investigateRumors = false
			done.enterSettlement = false
		}

		if (unit && !state.currentCommand && state.commands.length === 0) {
			if (unit.owner.input && unit.tile.rumors && !done.investigateRumors) {
				done.investigateRumors = true
				InvestigateRumors(unit)
			}

			if (unit.owner.input && unit.tile.settlement && !done.enterSettlement) {
				done.enterSettlement = true
				EnterSettlement(unit.tile.settlement, unit)
			}			
		}

		return keep || state.currentCommand || state.commands.length > 0
	}

	const stopped = () => {
		if (state.currentCommand) {
			if (unschedule) {
				unschedule()
			}
		}
	}

	return {
		priority: true,
		update,
		stopped,
		state
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