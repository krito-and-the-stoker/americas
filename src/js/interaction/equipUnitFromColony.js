import Storage from 'entity/storage'


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
}