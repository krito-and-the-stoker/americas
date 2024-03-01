import Storage from 'entity/storage'

const scheduledCargoLoads = {}
const scheduled = () => scheduledCargoLoads

const init = name => {
  scheduled()[name] = Storage.create()
}

const add = (colony, pack) => {
  if (!scheduled()[colony.name]) {
    init(colony.name)
  }
  scheduled()[colony.name][pack.good] -= pack.amount

  return () => remove(colony, pack)
}
const remove = (colony, pack) => {
  if (!scheduled()[colony.name]) {
    init(colony.name)
  }
  scheduled()[colony.name][pack.good] += pack.amount
}
const get = (colony, good) => (scheduled()[colony.name] ? scheduled()[colony.name][good] : 0)

export default {
  get,
  add,
  remove,
}
