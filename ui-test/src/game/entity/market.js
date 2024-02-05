import Properties from 'data/market.json'

import Util from 'util/util'
import Message from 'util/message'
import Binding from 'util/binding'

import Time from 'timeline/time'

import Treasure from 'entity/treasure'

import MarketPrice from 'task/marketPrice'

const market = {
  europe: null,
}

const listen = {
  europe: fn => Binding.listen(market, 'europe', fn),
}

const update = {
  europe: value => Binding.update(market, 'europe', value),
}

const bid = good => market.europe[good].price
const ask = good => market.europe[good].price + Properties[good].difference

const buy = ({ good, amount }) => {
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

const unbuy = ({ good, amount }) => {
  const pricePerGood = ask(good)
  Treasure.gain(amount * pricePerGood)
  market.europe[good].storage += amount
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
  // ensure backward compatibility
  Object.entries(market.europe).forEach(([good, price]) => {
    if (!price.stability) {
      price.stability = Properties[good.stability]
    }
  })
  unsubscribeMarketPrices()
  unsubscribeMarketPrices = Time.schedule(MarketPrice.create(market.europe))
}

let unsubscribeMarketPrices = () => {}
const initialize = () => {
  market.europe = Util.makeObject(
    Object.keys(Properties)
      .map(good => [
        good,
        Properties[good].low +
          Math.floor(Math.random() * (Properties[good].high - Properties[good].low)),
      ])
      .map(([good, price]) => [
        good,
        {
          price,
          storage: Properties[good].capacity * Math.random(),
          consumption: Properties[good].consumption,
          capacity: Properties[good].capacity,
          stability: Properties[good].stability,
        },
      ])
  )

  unsubscribeMarketPrices()
  unsubscribeMarketPrices = Time.schedule(MarketPrice.create(market.europe))
}

export default {
  buy,
  unbuy,
  sell,
  ask,
  bid,
  save,
  load,
  initialize,
  update,
  listen,
}
