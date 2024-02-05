import Market from 'entity/market'
import Unit from 'entity/unit'


export default (unit, pack) => {	
	Market.sell(pack)
	Unit.loadGoods(unit, { good: pack.good, amount: -pack.amount })
}
