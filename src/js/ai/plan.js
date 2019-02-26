import Util from 'util/util'

const cheapest = actions => Util.min(actions.filter(p => !!p), action => action.cost)

export default {
	cheapest,
}