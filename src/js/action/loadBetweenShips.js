import Unit from '../entity/unit'

export default (src, dest, pack) => {
	if (Unit.loadGoods(dest, pack)) {
		Unit.loadGoods(src, { good: pack.good, amount: -pack.amount })
	}
}
