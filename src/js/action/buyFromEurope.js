import Market from '../entity/market'
import Unit from '../entity/unit'

// TODO: Fixme, this is a buggy implementation of buying stuff in europe
export default (unit, pack) => {
	let boughtAmount = Market.buy(pack)
	if (amount > 0) {
		Unit.loadGoods(unit, { good, amount: boughtAmount })
	}
}
