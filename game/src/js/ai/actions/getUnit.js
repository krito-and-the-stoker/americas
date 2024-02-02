import Util from 'util/util'

import Plan from 'ai/plan'
import AssignUnit from 'ai/actions/assignUnit'
import CreateUnit from 'ai/actions/createUnit'


const create = ({ owner, coords }) => {
	return Plan.cheapest([
		AssignUnit.create({ owner, coords }),
		CreateUnit.create({ owner, coords })
	].filter(a => !!a).map(action => {
		action.cost += Util.distance(coords, action.coords)
		return action
	}))
}



export default {
	create,
}