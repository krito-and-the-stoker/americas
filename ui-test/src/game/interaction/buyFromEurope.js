import Market from 'entity/market'
import Unit from 'entity/unit'

// TODO: Fixme, this is a buggy implementation of buying stuff in europe
export default (unit, pack) => {
  let reservedAmount = Market.buy(pack)
  if (reservedAmount > 0) {
    const boughtAmount = Unit.loadGoods(unit, {
      good: pack.good,
      amount: reservedAmount,
    })
    if (boughtAmount < reservedAmount) {
      Market.unbuy({
        good: pack.good,
        amount: reservedAmount - boughtAmount,
      })
    }
  }
}
