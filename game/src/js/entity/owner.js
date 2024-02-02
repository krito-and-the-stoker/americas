import Util from 'util/util'
import Binding from 'util/binding'
import Record from 'util/record'

import Natives from 'ai/natives'


let playerColors = [0x9b1818]
let nativeColors = [0x2d3199, 0x276043, 0x4b661a, 0xd1a22b, 0x77226f, 0x20a3b5, 0xcce2b3, 0xf779b6]
let currentPlayer = null
const create = type => {
	const owner = {
		visible: type === 'player',
		input: type === 'player',
		color: Util.choose(type === 'player' ? playerColors : nativeColors),
		ai: null,
		type
	}

	nativeColors = nativeColors.filter(color => color !== owner.color)
	playerColors = playerColors.filter(color => color !== owner.color)

	if (type === 'player') {
		currentPlayer = owner
	}

	Record.add('owner', owner)

	if (owner.type === 'natives') {
		owner.ai = Natives.create(owner)
	}

	return owner
}

const save = owner => ({
	visible: owner.visible,
	input: owner.input,
	color: owner.color,
	type: owner.type,
	ai: owner.type === 'natives' ? Natives.save(owner.ai) : null,
	currentPlayer: owner === currentPlayer
})

const load = owner => {
	if (owner.currentPlayer) {
		currentPlayer = owner
	}

	if (owner.type === 'natives') {
		owner.ai = Natives.load(owner.ai)
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