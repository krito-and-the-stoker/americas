export default (colony, unit, pack) => {
	if (unit.name === 'settler') {
		if (good === 'tools') {
			const maximumAmount = Math.min(amount, 100 - unit.equipment.tools)
			const roundedAmount = 5 * Math.floor(maximumAmount / 5)
			if (roundedAmount > 0) {
				Storage.update(colony.storage, 'tools', -roundedAmount)
				Storage.update(unit.equipment, 'tool', roundedAmount)
			}
		}
	}
	if (['settler', 'scout', 'soldier', 'dragoon'].includes(unit.name)) {
		if (good === 'guns' || good === 'horses') {
			const maximumAmount = Math.min(amount, 100 - unit.equipment[good])
			Storage.update(colony.storage, good, -maximumAmount)
			Storage.update(unit.equipment, good, maximumAmount)
		}
	}
}