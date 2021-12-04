import Util from 'util/util'

import Storage from 'entity/storage'
import Unit from 'entity/unit'


export default (ship, unit, pack) => {
	const { good, amount } = pack
	if (unit.name === 'settler') {
		if (good === 'tools') {
			const maximumAmount = Math.min(amount, Unit.PIONEER_MAX_TOOLS - unit.equipment.tools)
			const roundedAmount = Util.quantizeDown(maximumAmount, TERRAFORM_TOOLS_CONSUMPTION)
			if (roundedAmount > 0) {
				Storage.transfer(ship.storage, unit.equipment, { good: 'tools', amount: roundedAmount })
			}
		}
	}
	if (['settler', 'scout', 'soldier', 'dragoon'].includes(unit.name)) {
		if (good === 'guns' || good === 'horses') {
			const maximumAmount = Math.min(amount, 50 - unit.equipment[good])
			Storage.transfer(ship.storage, unit.equipment, { good, amount: maximumAmount })
		}
	}
}