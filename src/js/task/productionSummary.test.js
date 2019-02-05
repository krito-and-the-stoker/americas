import 'test/min-setup'

import Util from 'util/util'
import Colony from 'entity/colony'
import Unit from 'entity/unit'
import Owner from 'entity/owner'
import Storage from 'entity/storage'
import Time from 'timeline/time'
import BecomeColonist from 'interaction/becomeColonist'
import FindWork from 'interaction/findWork'


const timings = Util.range(100).map(() => 1000 * Math.random())

test('1 colonist working', () => {
	const unit = Unit.create('settler', { x:1, y: 1 }, Owner.player())
	const colony = Colony.create({ x:1, y: 1 }, Owner.player())
	BecomeColonist(colony, unit)
	FindWork(unit.colonist)

	Time.advance(500)
	Time.advance(500)
	const expectedProduction = Storage.createWithProduction()
	const transfer = pack => { expectedProduction[pack.good] = pack.amount }
	Storage.goods(colony.productionSummary).forEach(transfer)
	Storage.productions(colony.productionSummary).forEach(transfer)

	timings.forEach(deltaTime => {
		Time.advance(deltaTime)
		expect(colony.productionSummary).toEqual(expectedProduction)
	})
})