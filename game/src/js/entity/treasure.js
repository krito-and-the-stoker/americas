import Binding from 'util/binding'

let treasure = {
	amount: 5000,
	maximum: 5000
}

const initialize = () => {
	listen.amount(amount => {
		if (amount > treasure.maximum) {
			treasure.maximum = amount
		}
	})
}

const spend = amount => {
	if (treasure.amount >= amount) {
		set(treasure.amount - amount)

		return true
	}
	return false
}

const gain = amount => {
	set(treasure.amount + amount)
}

const set = amount => {
	update.amount(amount)
}

const amount = () => treasure.amount
const maximum = () => treasure.maximum

const listen = {
	amount: fn => Binding.listen(treasure, 'amount', fn)
}

const update = {
	amount: value => Binding.update(treasure, 'amount', value)
}

const save = () => ({
	amount: treasure.amount,
	maximum: treasure.maximum
})

const load = data => {
	update.amount(data.amount)
	treasure.amount = data.amount
}

export default {
	spend,
	gain,
	listen,
	amount,
	maximum,
	save,
	load,
	initialize,
	set
}