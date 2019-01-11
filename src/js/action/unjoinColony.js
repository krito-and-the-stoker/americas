import Colonist from '../entity/colonist'
import Colony from '../entity/Colony'

export default colonist => {
	const colony = colonist.colony
	Colonist.stopWorking(colonist)
	Colony.remove(colonist)
	colonist.colony = null
}