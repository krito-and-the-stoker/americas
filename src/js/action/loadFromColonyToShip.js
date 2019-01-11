import Unit from '../entity/unit'
import Storage from '../entity/storage'

export default (colony, unit, pack) => {	
	if (Unit.loadGoods(unit, pack)) {
		Storage.update(colony.storage, { good: pack.good, amount: -pack.amount })
	}
}
