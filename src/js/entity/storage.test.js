import Storage from 'entity/storage'

test('create', () => {
	Storage.create()
})

test('update', () => {
	const storage = Storage.create()
	const pack = { good: 'tools', amount: 100 }
	Storage.update(storage, pack)
	expect(storage.tools).toBe(100)
})

test('transfer', () => {
	const storage = Storage.create()
	const other = Storage.create()
	const pack = { good: 'tools', amount: 100 }
	Storage.update(storage, pack)
	Storage.transfer(storage, other)
	expect(storage.tools).toBe(0)
	expect(other.tools).toBe(100)
})