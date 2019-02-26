import Util from 'util/util'

import Storage from 'entity/storage'


const value = storage => {
	const prices = {
		food: 7,
		sugar: 3,
		tobacco: 3,
		cotton: 4,
		furs: 5,
		wood: 2,
		ore: 1,
		silver: 3,
		horses: 20,
		rum: 8,
		cigars: 7,
		cloth: 10,
		coats: 10,
		tradeGoods: 7,
		tools: 15,
		guns: 20,
	}

	return Util.sum(Storage.goods(storage).map(pack => prices[pack.good] * pack.amount))
}

export default {
	value
}