export default (ship, unit, pack) => {
	if (unit.name === 'settler') {
		if (good === 'tools') {
			const maximumAmount = Math.min(amount, 100 - unit.equipment.tools)
			const roundedAmount = 5 * Math.floor(maximumAmount / 5)
			if (roundedAmount > 0) {
				Storage.update(ship.storage, 'tools', -roundedAmount)
				Storage.update(unit.equipment, 'tool', roundedAmount)
			}
		}
	}
	if (['settler', 'scout', 'soldier', 'dragoon'].includes(unit.name)) {
		if (good === 'guns' || good === 'horses') {
			const maximumAmount = Math.min(amount, 100 - unit.equipment[good])
			Storage.update(ship.storage, good, -maximumAmount)
			Storage.update(unit.equipment, good, maximumAmount)
		}
	}
}