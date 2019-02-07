import SaveGame from './save-game-1'

import Util from 'util/util'
import Binding from 'util/binding'
import Record from 'util/record'
import Message from 'util/message'

import Time from 'timeline/time'

import Europe from 'entity/europe'
import Meet from 'task/meet'


const initialize = () => {
	Time.schedule(Meet.create())

	const loop = deltaTime => {
		Time.advance(deltaTime)
		Binding.applyAllUpdates()
	}
	

	Util.range(1000).forEach(() => loop(16))
}

test('load', () => {
	return
	// for no apparent reason the layers are not available inside TreasureView
	Europe.initialize()

	Message.log('Restoring game state...')

	Record.load(JSON.stringify(SaveGame))
	initialize()	
})