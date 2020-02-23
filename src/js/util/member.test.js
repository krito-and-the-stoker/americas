import Member from './member'
// import Binding from './binding'

const obj = {
	list: []
}

const add = x => Member.add(obj, 'list', x)
const remove = x => Member.remove(obj, 'list', x)


test('it works when adding and removing', () => {
	let move = null
	const logger = (arg, added) => {
		move = added ? 'added' : 'updated'

		return () => {
			move = 'destroyed'
		}
	}

	obj.list = []
	const unsubscribe = Member.listenEach(obj, 'list', logger)

	const hallo = {
		data: 'hallo'
	}
	const welt = {
		data: 'welt'
	}

	add(hallo)
	expect(move).toBe('added')
	add(welt)
	expect(move).toBe('added')
	// Binding.update(hallo, 'data', 'hallo2')
	// Binding.applyAllUpdates()
	// expect(move).toBe('updated')
	// Binding.update(welt, 'data', 'welt2')
	// Binding.applyAllUpdates()
	// expect(move).toBe('updated')
	remove(welt)
	expect(move).toBe('destroyed')
	remove(hallo)
	expect(move).toBe('destroyed')



	unsubscribe()
})

const o1 = {
	value: 1
}
const o2 = {
	value: 2
}
const o3 = {
	value: 3
}
const o4 = {
	value: 4
}
const o5 = {
	value: 5
}
const o6 = {
	value: 6
}

test('added variable works', () => {
	obj.list = [o1, o2, o3, o4]

	const unsubscribe = Member.listenEach(obj, 'list', (o, added) => {
		expect([o1, o2, o3, o4].includes(o)).toBe(!added)
	})

	add(o5)
	remove(o3)
	add(o6)

	unsubscribe()
})