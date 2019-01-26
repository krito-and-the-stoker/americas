import Binding from 'util/binding'
import Record from 'util/record'

let currentPlayer = null
const create = type => {
	const owner = {
		visible: type === 'player',
		input: type === 'player'
	}

	if (type === 'player') {
		currentPlayer = owner
	}

	Record.add('owner', owner)

	return owner
}

const save = owner => ({
	visible: owner.visible,
	input: owner.input,
	currentPlayer: owner === currentPlayer
})

const load = owner => {
	if (owner.currentPlayer) {
		currentPlayer = owner
	}

	return owner
}

const listen = {
	input: (owner, fn) => Binding.listen(owner, 'input', fn),
	visible: (owner, fn) => Binding.listen(owner, 'visible', fn)
}

const update = {
	input: (owner, value) => Binding.update(owner, 'input', value),
	visible: (owner, value) => Binding.update(owner, 'visible', value)
}

const player = () => currentPlayer

const initialize = () => {
	create('player')
}

export default {
	create,
	player,
	listen,
	update,
	initialize,
	save,
	load
}