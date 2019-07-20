import Storage from 'entity/storage'
import Unit from 'entity/unit'


export default (colony, unit, pack) => {
	const { good, amount } = pack
	if (unit.name === 'settler') {
		if (good === 'tools') {
			const maximumAmount = Math.min(amount, 100 - unit.equipment.tools)
			const roundedAmount = 20 * Math.floor(maximumAmount / 20)
			if (roundedAmount > 0) {
				Storage.transfer(colony.storage, unit.equipment, { good: 'tools', amount: roundedAmount })
			}
		}
	}
	if (['settler', 'scout', 'soldier', 'dragoon'].includes(unit.name)) {
		if (good === 'guns' || good === 'horses') {
			const maximumAmount = Math.min(amount, 50 - unit.equipment[good])
			Storage.transfer(colony.storage, unit.equipment, { good, amount: maximumAmount })
		}
	}

	if (good === 'food') {
		const maximumAmount = Math.min(amount, Unit.UNIT_FOOD_CAPACITY - unit.equipment.food)
		Storage.transfer(colony.storage, unit.equipment, { good, amount: maximumAmount })
	}
}