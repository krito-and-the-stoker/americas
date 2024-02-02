import Owner from 'entity/owner'
import Tribe from 'entity/tribe'


test('create', () => {
	const owner = Owner.create('natives')
	Tribe.create(1, owner)
})