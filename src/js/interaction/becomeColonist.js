import Colonist from 'entity/colonist'
import Unit from 'entity/unit'

import JoinColony from 'interaction/joinColony'


export default (colony, unit) => {
	const colonist = Colonist.create(unit)
	Unit.update.colonist(unit, colonist)
	JoinColony(colony, colonist)
}