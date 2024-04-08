import $ from 'signal-chain'

import {
  create,
  disband,
  at,
} from './unit'

import {
  FOOD_COST,
  PIONEER_MAX_TOOLS,
  TERRAFORM_TOOLS_CONSUMPTION,
  UNIT_FOOD_CAPACITY,
  TRAVEL_EQUIPMENT
} from './constants'

import {
  listen,
  update,
  add,
  remove,
  computed
} from './binding'

import { save, load } from './serialize'

import {
  goTo,
  updateType,
  unloadUnit,
  unloadAllUnits,
  loadGoods,
  loadUnit
} from './actions'

import * as chain from './chain'

export default {
  create,
  disband,
  at,

  save,
  load,

  goTo,
  updateType,
  unloadUnit,
  unloadAllUnits,
  loadGoods,
  loadUnit,

  chain,

  overWeight: $.function(chain.overWeight),
  speed: $.function(chain.speed),
  additionalEquipment: $.function(chain.additionalEquipment),
  isIdle: $.function(chain.isIdle),
  isMoving: $.function(chain.isMoving),
  hasCapacity: $.function(chain.hasCapacity),
  area: $.function(chain.area),
  strength: $.function(chain.strength),
  name: $.function(chain.name),

  listen,
  add,
  remove,
  update,
  computed,

  UNIT_FOOD_CAPACITY,
  FOOD_COST,
  TERRAFORM_TOOLS_CONSUMPTION,
  PIONEER_MAX_TOOLS,
  TRAVEL_EQUIPMENT,
}