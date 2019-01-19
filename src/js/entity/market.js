import Properties from '../data/market.json'
import Treasure from './treasure'
import Util from '../util/util'
import Message from '../view/ui/message'
import Time from '../timeline/time'
import MarketPrice from '../task/marketPrice'
import Binding from '../util/binding'


const market = {
	europe: null
}

const listen = {
	europe: fn => Binding.listen(market, 'europe', fn)
}

const update = {
	europe: value => Binding.update(market, 'europe', value)
}

const bid = good => market.europe[good].price
const ask = good => market.europe[good].price + Properties[good].difference

const buy = ({ good, amount }) => {
	console.log(market.europe)
	const pricePerGood = ask(good)
	const price = pricePerGood * amount
	if (Treasure.spend(price)) {
		Message.send(`bought ${amount} ${good}`)
		market.europe[good].storage -= amount
		return amount
	}
	const actualAmount = Math.floor(Treasure.amount() / pricePerGood)
	Treasure.spend(actualAmount * pricePerGood)
	Message.send(`bought ${actualAmount} ${good}`)
	market.europe[good].storage -= actualAmount
	return actualAmount
}

const sell = ({ good, amount }) => {
	const pricePerGood = bid(good)
	Treasure.gain(amount * pricePerGood)
	Message.send(`sold ${amount} ${good}`)
	market.europe[good].storage += amount
}

const save = () => market.europe
const load = data => {
	market.europe = data
}

const initialize = () => {
	market.europe = Util.makeObject(Object.keys(Properties)
		.map(good => [good, Properties[good].low + Math.floor(Math.random() * (Properties[good].high - Properties[good].low))])
		.map(([good, price]) => ([ good, {
			price,
			storage: Properties[good].capacity * Math.random(),
			consumption: Properties[good].consumption,
			capacity: Properties[good].capacity
		}])))

	Time.schedule(MarketPrice.create(market.europe))
	console.log(Object.entries(market.europe).map(([good, props]) => `${good}: ${props.price}`))
}

export default {
	buy,
	sell,
	ask,
	bid,
	save,
	load,
	initialize,
	update,
	listen
}