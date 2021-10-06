import 'test/min-setup'

import Util from 'util/util'
import Colony from 'entity/colony'
import Unit from 'entity/unit'
import Owner from 'entity/owner'
import Storage from 'entity/storage'

import Time from 'timeline/time'
import FindWork from 'interaction/findWork'



test.skip('1 colonist working', () => {
	const timings = Util.range(100).map(() => 1000 * Math.random())

	const unit = Unit.create('settler', { x:1, y: 1 }, Owner.player())
	const colony = Colony.create({ x:1, y: 1 }, Owner.player())
	FindWork(unit.colonist)

	Time.advance(500)
	Time.advance(500)
	Time.advance(500)

	let expectedProduction = null
	Storage.listen(colony.productionSummary, summary => {
		if (expectedProduction) {
			expect(Storage.equals(summary, expectedProduction)).toBe(true)
		}

		expectedProduction = Storage.copy(summary)
	})

	timings.forEach(deltaTime => {
		Time.advance(deltaTime)
	})
})
