import Owner from 'entity/owner'
import Actions from 'ai/actions'

Object.values(Actions).forEach(Module => {
	const owner = Owner.create('player')
	const state = {
		relations: {
			[owner.referenceId]: {
				established: true
			}
		},
		units: {},
		settlements: {}
	}

	const goal = {
		key: ['relations', 1, 'established'],
		value: true
	}

	test('name', () => {
		Module.name()
	})

	test('produces', () => {
		Module.produces(state, goal)
	})

	test('needs', () => {
		Module.needs(state, goal)
	})

	test('cost', () => {
		Module.cost(state, goal)
	})
})
