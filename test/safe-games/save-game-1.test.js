import SaveGame from './save-game-1'

import Util from 'util/util'
import Record from 'util/record'
import Message from 'util/message'

import Time from 'timeline/time'

import Europe from 'entity/europe'
import Meet from 'task/meet'


const initialize = () => {
	Time.schedule(Meet.create())
	Util.range(1500).forEach(() => Time.advance(16 + 16*Math.random()))
}

test('load', () => {
	Europe.initialize()

	Message.log('Restoring game state...')

	Record.load(JSON.stringify(SaveGame))
	initialize()	
})