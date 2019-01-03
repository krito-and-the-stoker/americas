import Time from '../timeline/time'


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

	return commander
}

export default {
	create,
	scheduleInstead,
	scheduleBehind
}