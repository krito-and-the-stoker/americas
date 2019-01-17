import Found from '../command/found'
import Move from '../command/move'
import MoveTo from '../command/moveTo'
import Unload from '../command/unload'
import Load from '../command/load'
import Europe from '../command/europe'
import America from '../command/america'
import CutForest from '../command/cutForest'
import TriggerEvent from '../command/triggerEvent'
import Plow from '../command/plow'
import Road from '../command/road'
import Time from '../timeline/time'

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
	if (commander.commands) {
		commander.commands = []
	}
	if (commander.currentCommand) {
		clearSchedule(commander.currentCommand)
	}
}

const commandsScheduled = command => {
		const current = command.currentCommand ? commandsScheduled(command.currentCommand) : 1
		const other = command.commands ? command.commands.map(commandsScheduled).reduce((sum, count) => sum + count, 0) : 0

		return current + other
}

const create = (args = {}) => {
	const keep = args.keep || false
	const commands = args.commands || []
	const commander = {
		commands,
		currentCommand: null
	}

	commander.update = currentTime => {
		if (!commander.currentCommand && commander.commands.length > 0) {
			commander.currentCommand = commander.commands.shift()
			const originalFinished = commander.currentCommand.finished
			commander.currentCommand.finished = () => {
				if (originalFinished) {
					originalFinished()
				}
				commander.currentCommand = null
			}
			Time.schedule(commander.currentCommand)
		}
		return keep || commander.currentCommand || commander.commands.length > 0
	}

	commander.save = () => ({
		commands: commander.commands.map(command => command.save()),
		currentCommand: commander.currentCommand ? commander.currentCommand.save() : null,
		type: 'commander',
		keep,
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
	triggerEvent: TriggerEvent,
	commander: { load }
})[type] : { load: data => console.warn('cannot load command, missing type', data) }) 


const load = data => {
	const commands = (data.currentCommand ? [data.currentCommand, ...data.commands] : data.commands).map(cmd => getModule(cmd.type).load(cmd))
	return create({ keep: data.keep, commands })
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