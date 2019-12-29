import Binding from './binding'

const obj = {
	key: 'value',
	number: 1
}
test('it works when empty', () => {
	let x = 0
	const unsubscribe = Binding.listen(obj, 'key', () => {
		x += 1
	})
	expect(x).toBe(1)

	unsubscribe()
})

test('it works with numbers', () => {
	let listened = 0
	const unsubscribe = Binding.listen(obj, 'number', number => {
		listened = number
	})

	expect(listened).toBe(1)

	Binding.update(obj, 'number', 5)
	Binding.applyAllUpdates()
	expect(listened).toBe(5)

	unsubscribe()
})

test('broadcast works as expected', () => {
	let last = null

	const unsubscribe = Binding.listen(obj, null, x => {
		last = x
	})

	Binding.update(obj, 'key', 'new value')
	Binding.applyAllUpdates()
	expect(last.key).toBe('new value')

	unsubscribe()
})