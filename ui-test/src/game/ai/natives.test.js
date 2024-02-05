import Owner from 'entity/owner'
import Tribe from 'entity/tribe'

test('create', () => {
  const owner = Owner.create('natives')
  const tribe = Tribe.create(1, owner)

  const ai = owner.ai
})
