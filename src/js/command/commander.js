import Found from '../command/found'
import Move from '../command/move'
import MoveTo from '../command/moveTo'
import Report from '../command/report'
import Unload from '../command/unload'
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

const scheduleBehind = (commander, command) => {
	commander.commands.push(command)
}

const clearSchedule = (commander) => {
	commander.commands = []
	if (commander.currentCommand) {
		clearSchedule(commander.currentCommand)
	}
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
	report: Report,
	unload: Unload,
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
	scheduleBehind
}