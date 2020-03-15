import Message from 'util/message'

import Time from 'timeline/time'

import Unit from 'entity/unit'

import Factory from 'command/factory'

import EnterEurope from 'interaction/enterEurope'

export default Factory.create('Europe', {
	unit: {
		type: 'entity',
		required: true
	},
	progress: {
		type: 'raw'
	},
	direction: {
		type: 'raw'
	}
}, {
	id: 'europe',
	display: 'Travelling to Europe'
}, state => {
	const { unit } = state

	const init = () => {
		const tile = unit.tile
		if (!tile || tile.name !== 'sea lane') {
			Message.warn('not going to europe', tile.name, unit, tile)
			return false
		}

		Unit.update.offTheMap(unit, true)
		return {
			progress: 0,
			direction: 1
		}
	}

	const update = (currentTime, deltaTime) => {
		state.progress += state.direction * (deltaTime / Time.EUROPE_SAIL_TIME)
		return state.progress >= 0 && state.progress <= 1
	}

	const finished = () => {
		if (state.progress >= 1) {
			Message.send(`A ${Unit.name(unit)} arrived in Europe.`)
			EnterEurope(unit)
		} else {
			Message.send(`A ${Unit.name(unit)} arrived back in the Americas.`)
			Unit.update.offTheMap(unit, false)
		}
	}

	const cancel = () => {
		state.direction *= -1
	}

	return {
		init,
		update,
		cancel,
		finished
	}
})
