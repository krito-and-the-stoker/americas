import Util from 'util/util'

const cheapest = actions => {
  const result = Util.min(
    actions.filter(a => !!a),
    action => action.cost
  )
  actions
    .filter(action => action && action !== result)
    .forEach(action => Util.execute(action.dismiss))

  return result
}

export default {
  cheapest,
}
