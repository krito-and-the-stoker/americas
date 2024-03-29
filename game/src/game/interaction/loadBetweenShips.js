import Unit from 'entity/unit'

export default (src, dest, pack) => {
  const amountLoaded = Unit.loadGoods(dest, pack)
  if (amountLoaded > 0) {
    Unit.loadGoods(src, { good: pack.good, amount: -amountLoaded })
  }
}
