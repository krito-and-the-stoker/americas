import chain from 'entity/colony/chain'
import { add, listen, listenEach, update, remove } from 'entity/colony/binding'
import { create } from './colony'
import Fn from 'entity/colony/functions'

export default {
  add,
  create,
  listen,
  listenEach,
  chain,
  remove,
  update,
  canFillEquipment: Fn.canFillEquipment,
  addBuilding: Fn.addBuilding,
  disband: Fn.disband,
  expertLevel: Fn.expertLevel,
  load: Fn.load,
  save: Fn.save,
  isReachable: Fn.isReachable,
}
