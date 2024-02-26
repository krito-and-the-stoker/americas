import Util from 'util/util'
import Record from 'util/record'
import Message from 'util/message'

import Time from 'timeline/time'

import Europe from 'entity/europe'
import Meet from 'task/meet'


export default (game, steps = 750) => {
	test.skip('load save game', () => {
		Europe.initialize()

		Message.log('Restoring game state...')

		// might be broken, look at initRenderMapFn
		Record.resume(JSON.stringify(game))

		Time.schedule(Meet.create())
		Util.range(steps).forEach(() => Time.advance(16 + 16*Math.random()))
	})
}
