import Storage from 'entity/storage'


export default (colony, unit) => {
	const goods = Storage.goods(unit.equipment)
	const hasNonFoodGoods = goods
		.filter(pack => pack.good !== 'food' && pack.amount > 0)
		.length > 0

	// if has goods other than food, transfer only these
	if (hasNonFoodGoods) {
		goods.filter(pack => pack.good !== 'food')
			.forEach(pack => {
				Storage.transfer(unit.equipment, colony.storage, pack)
			})
	} else {
		// otherwise, transfer the food
		Storage.transfer(unit.equipment, colony.storage)
	}
}