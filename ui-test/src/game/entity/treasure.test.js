import Treasure from 'entity/treasure'

beforeEach(() => {
  Treasure.set(100)
})

test('amount', () => {
  expect(Treasure.amount()).toBe(100)
})

test('spend', () => {
  Treasure.spend(100)
  expect(Treasure.amount()).toBe(0)
})

test('gain', () => {
  Treasure.gain(1000)
  expect(Treasure.amount()).toBe(1100)
})

test('spend2', () => {
  const ok = Treasure.spend(2000)
  expect(ok).toBe(false)
  expect(Treasure.amount()).toBe(100)
})
