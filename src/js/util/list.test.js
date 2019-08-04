import List from './list'

const obj = {
	list: []
}

const add = x => List.add(obj, 'list', x)
const remove = x => List.remove(obj, 'list', x)


test('it works when empty', () => {
	let create = null
	let destroy = null
	const logger = arg => {
		create = arg
		return () => {
			destroy = arg
		}
	}

	const unsubscribe = List.listen(obj, 'list', logger)

	const hallo = 'hallo'
	const welt = 'welt'

	add(hallo)
	expect(create).toBe(hallo)
	add(welt)
	expect(create).toBe(welt)
	remove(welt)
	expect(destroy).toBe(welt)
	remove(hallo)
	expect(destroy).toBe(hallo)

	unsubscribe()
})

test('it works when prefilled and with unique numbers', () => {
	obj.list = [1, 2, 3, 4, 5, 6, 7]
	const reducer = array => array.reduce((sum, elem) => sum + elem, 0)

	let sum = 0
	const summize = arg => {
		sum += arg
		return () => {
			sum -= arg
		}
	}

	const numbers = [5, 456, 432, 56 , 3, 14, 4, 6457, 45, 234]

	const unsubscribe = List.listen(obj, 'list', summize)
	expect(sum).toBe(reducer(obj.list))

	numbers.forEach(x => {
		add(x)
		expect(sum).toBe(reducer(obj.list))
	})

	numbers.forEach(x => {
		remove(x)
		expect(sum).toBe(reducer(obj.list))
	})

	unsubscribe()
})

test('added argument works', () => {
	obj.list = [1]

	let count = 0
	const unsubscribe = List.listen(obj, 'list', (number, added) => {
		count += 1
		expect(number !== 1).toBe(added)
	})

	add(2)

	expect(count).toBe(2)

	unsubscribe()
})