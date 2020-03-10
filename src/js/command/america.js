import Message from 'util/message'

import Time from 'timeline/time'

import Europe from 'entity/europe'
import Unit from 'entity/unit'

import Factory from 'command/factory'


export default Factory.create('America', {
	unit: {
		type: 'entity',
		required: true,
	},
	progress: {
		type: 'raw',
	},
	direction: {
		type: 'raw'
	}
}, {
	id: 'america',
	display: 'Travelling to the Americas'
}, state => {
	const { unit } = state

	const init = () => {
		if (!Europe.has.unit(unit)) {
			console.warn('unit is not in europe', unit.name)
			return false
		}

		Europe.remove.unit(unit)

		return {
			direction: 1,
			progress: 0
		}
	}

	const update = (currentTime, deltaTime) => {
		state.progress += state.direction * (deltaTime / Time.EUROPE_SAIL_TIME)
		return state.progress >= 0 && state.progress <= 1
	}

	const finished = () => {
		if (state.progress >= 1) {		
			Message.send(`A ${unit.name} arrived in the new world.`)
			Unit.update.offTheMap(unit, false)
		} else {
			Message.send(`A ${unit.name} arrived back in Europe.`)
			Europe.add.unit(unit)
		}
	}

	// const cancel = () => {
	// 	state.direction *= -1
	// }


	return {
		init,
		update,
		finished,
	}		
})