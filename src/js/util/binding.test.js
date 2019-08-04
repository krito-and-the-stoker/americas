import Binding from './binding'

const obj = {
	key: 'value',
	number: 1
}
test('it works when empty', () => {
	let x = 0
	Binding.listen(obj, 'key', () => {
		x += 1
	})
	expect(x).toBe(1)
})
