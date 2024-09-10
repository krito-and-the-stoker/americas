import Time from 'timeline/time'

import Market from 'entity/market'

const PRODUCTION_BASE_FACTOR = 1.0 / Time.PRODUCTION_BASE_TIME
const MIN_PRICE = 1
const MAX_PRICE = 200

const consumptionFactor = () => 1.25
const log2 = Math.log(2)
// double consumption every x years
const CONSUMPTION_DOUBLE_TIME = 50.0
const CONSUMPTION_START_YEAR = 1607
const consumption = (base, year) => base * Math.exp((log2 * (year - CONSUMPTION_START_YEAR)) / CONSUMPTION_DOUBLE_TIME)

const create = market => {
  const update = (currentTime, deltaTime) => {
    const scale = PRODUCTION_BASE_FACTOR * deltaTime

    Object.keys(market).forEach(good => {
      market[good].storage -= scale * consumption(market[good].consumption, Time.get().year)
      if (market[good].storage < 0) {
        if (market[good].price < MAX_PRICE) {
          market[good].price += 1
          if (market[good].consumption > 0) {
            market[good].consumption /= consumptionFactor()
          } else {
            market[good].consumption *= consumptionFactor()
          }
        }
        market[good].storage += market[good].capacity
      }
      if (market[good].storage > market[good].capacity) {
        if (market[good].price > MIN_PRICE) {
          market[good].price -= 1
          if (market[good].consumption > 0) {
            market[good].consumption *= consumptionFactor()
          } else {
            market[good].consumption /= consumptionFactor()
          }
        }
        market[good].storage -= market[good].capacity
      }
    })
    Market.update.europe()

    return true
  }

  return {
    update,
  }
}

export default { create }
