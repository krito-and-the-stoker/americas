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
    power: $.computed(chain.power),

    profession: $.computed(chain.profession),
    expertName: $.computed(chain.expertName),
    professionName: $.computed(chain.professionName),
    canPromote: $.computed(chain.canPromote),
    promotionTarget: $.computed(chain.promotionTarget),
    needsForPromotion: $.computed(chain.needsForPromotion),

    chain,
    listen,
    update,
}
