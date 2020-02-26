import Util from 'util/util'
import Binding from 'util/binding'

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
		if (parent.state.currentCommand && parent.state.currentCommand.cancel) {
			parent.state.currentCommand.cancel()
		}
		if (parent.state.currentCommand && parent.state.currentCommand.state) {
			schedule.clear(parent.state.currentCommand)
		}
	},
}

const startCurrentCommand = state => {
	const command = state.currentCommand
	const originalFinished = command.finished

	const unsubscribeCommandInfo = Binding.listen(command, 'info', info =>
		Binding.update(state, 'info', info))

	state.currentCommand.finished = () => {
		Util.execute(originalFinished)
		Util.execute(unsubscribeCommandInfo)
		state.currentCommand = null
		Binding.update(state, 'info', {
			id: 'idle',
			display: 'Resting'
		})
	}

	return [
		Time.schedule(command),
		unsubscribeCommandInfo
	]
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
}, {
	id: 'idle',
	display: 'Resting'
}, state => {
	const { keep, unit } = state
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
			unschedule = startCurrentCommand(state)

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
		Util.execute(unschedule)
	}

	const loaded = () => {
		if (state.currentCommand) {
			unschedule = startCurrentCommand(state)
		}
	}

	return {
		priority: true,
		update,
		stopped,
		loaded,
		state
	}
})


export default {
	create,
	load,
	cancel,
	scheduleInstead,
	scheduleBehind,
	clearSchedule
}