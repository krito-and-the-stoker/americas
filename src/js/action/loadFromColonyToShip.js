import Unit from 'entity/unit'
import Storage from 'entity/storage'
import Commander from 'command/commander'

export default (colony, unit, pack) => {	
	if (Commander.isIdle(unit.commander) && Unit.loadGoods(unit, pack)) {
		Storage.update(colony.storage, { good: pack.good, amount: -pack.amount })
	}
}
