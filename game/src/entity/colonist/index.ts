import $ from 'signal-chain'

import Actions from './actions'
import { listen, update } from './binding'

import * as chain from './chains'
import { create } from './colonist'

export default {
    create,

    save: Actions.save,
    load: Actions.load,

    disband: Actions.disband,
    beginFieldWork: Actions.beginFieldWork,
    beginColonyWork: Actions.beginColonyWork,
    stopWorking: Actions.stopWorking,
    power: $.function(chain.power),

    profession: $.function(chain.profession),
    expertName: $.function(chain.expertName),
    professionName: $.function(chain.professionName),
    canPromote: $.function(chain.canPromote),
    promotionTarget: $.function(chain.promotionTarget),
    needsForPromotion: $.function(chain.needsForPromotion),

    chain,
    listen,
    update,
}
