import Time from 'timeline/time'
import Market from 'entity/market'

const PRODUCTION_BASE_FACTOR = 1.0 / Time.PRODUCTION_BASE_TIME
const MIN_PRICE = 1
const MAX_PRICE = 19

const consumptionFactor = () => 1.25 + 0.25*Math.random()
const log2 = Math.log(2)
const consumption = (base, year) => base * Math.exp(log2 * (year - 1492) / 50)

const create = market => {
	let lastUpdate = null
	const update = currentTime => {
		if (!lastUpdate) {
			lastUpdate = currentTime
			return true
		}
		const scale = PRODUCTION_BASE_FACTOR * (currentTime - lastUpdate)
		lastUpdate = currentTime
		
		if (scale > 0) {
			Object.keys(market).forEach(good => {
				market[good].storage -= scale * consumption(market[good].consumption, Time.get().year)
				if (market[good].storage < 0 && market[good].price < MAX_PRICE) {
					market[good].price += 1
					market[good].storage += market[good].capacity
					market[good].consumption /= consumptionFactor()
				}
				if (market[good].storage > market[good].capacity && market[good].price > MIN_PRICE) {
					market[good].price -= 1
					market[good].storage -= market[good].capacity
					market[good].consumption *= consumptionFactor()
				}
			})
			Market.update.europe()
		}

		return true
	}

	return {
		update
	}
}

export default { create }