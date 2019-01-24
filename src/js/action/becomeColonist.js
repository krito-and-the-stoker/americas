import Colonist from 'entity/colonist'
import JoinColony from './joinColony'
import Unit from 'entity/unit'

export default (colony, unit) => {
	const colonist = Colonist.create(unit)
	Unit.update.colonist(unit, colonist)
	JoinColony(colony, colonist)
}