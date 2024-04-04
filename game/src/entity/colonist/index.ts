import $ from 'signal-chain'

import JSFunctions from './colonist'
import { listen, update } from './binding'

import * as chain from './chains'


export default {
    create: JSFunctions.create,
    save: JSFunctions.save,
    load: JSFunctions.load,

    disband: JSFunctions.disband,
    beginFieldWork: JSFunctions.beginFieldWork,
    beginColonyWork: JSFunctions.beginColonyWork,
    stopWorking: JSFunctions.stopWorking,
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
