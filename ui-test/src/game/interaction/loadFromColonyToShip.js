import Unit from 'entity/unit'
import Storage from 'entity/storage'

export default (colony, unit, pack) => {
  const loadedAmount = Unit.loadGoods(unit, pack)
  if (loadedAmount > 0) {
    Storage.update(colony.storage, {
      good: pack.good,
      amount: -loadedAmount,
    })
  }
}
