import Treasure from './treasure'
import Util from '../util/util'
import Message from '../view/ui/message'

const Market = {
	food: {
		difference: 8,
		low: 1,
		high: 3
	},
	sugar: {
		difference: 2,
		low: 2,
		high: 5
	},
	tobacco: {
		difference: 2,
		low: 2,
		high: 5
	},
	cotton: {
		difference: 2,
		low: 2,
		high: 5
	},
	furs: {
		difference: 2,
		low: 2,
		high: 5
	},
	wood: {
		difference: 5,
		low: 2,
		high: 2
	},
	ore: {
		difference: 3,
		low: 2,
		high: 4
	},
	silver: {
		difference: 1,
		low: 19,
		high: 19
	},
	horses: {
		difference: 1,
		low: 1,
		high: 2
	},
	rum : {
		difference: 1,
		low: 8,
		high: 12
	},
	cigars : {
		difference: 1,
		low: 8,
		high: 12
	},
	cloth : {
		difference: 1,
		low: 8,
		high: 12
	},
	coats : {
		difference: 1,
		low: 8,
		high: 12
	},
	tradeGoods: {
		difference: 1,
		low: 1,
		high: 1
	},
	tools: {
		difference: 1,
		low: 1,
		high: 2
	},
	guns: {
		difference: 1,
		low: 1,
		high: 2
	}
}

let prices = Util.makeObject(Object.keys(Market)
	.map(good => [good, Market[good].low + Math.floor(Math.random() * (Market[good].high - Market[good].low))]))

const bid = good => prices[good]
const ask = good => prices[good] + Market[good].difference

const buy = ({ good, amount }) => {
	const pricePerGood = prices[good] + Market[good].difference
	const price = pricePerGood * amount
	if (Treasure.spend(price)) {
		Message.send(`bought ${amount} ${good}`)
		return amount
	}
	const actualAmount = Math.floor(Treasure.amount() / pricePerGood)
	Treasure.spend(actualAmount * pricePerGood)
	Message.send(`bought ${actualAmount} ${good}`)
	return actualAmount
}

const sell = ({ good, amount }) => {
	const pricePerGood = prices[good]
	Treasure.gain(amount * pricePerGood)
	Message.send(`sold ${amount} ${good}`)
}

const save = () => prices
const load = data => {
	prices = data
}

export default {
	buy,
	sell,
	ask,
	bid,
	save,
	load
}