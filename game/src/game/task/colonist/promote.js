import ColonistData from 'data/colonists'

import Time from 'timeline/time'

import Colonist from 'entity/colonist'
import Unit from 'entity/unit'
import Colony from 'entity/colony'
import Storage from 'entity/storage'

import Events from 'util/events'


const PROMOTION_BASE_FACTOR = 1.0 / Time.PROMOTION_BASE_TIME

const create = colony => {
  const update = (_, deltaTime) => {
    const scale = PROMOTION_BASE_FACTOR * deltaTime

    colony.colonists.filter(colonist => colonist.state.isPromoting).forEach(colonist => {
		  if (!colonist.promotion.progress) {
		    colonist.promotion.progress = {}
		  }

		  const target = Colonist.promotionTarget(colonist)
		  if (!colonist.promotion.progress[target]) {
		    colonist.promotion.progress[target] = 0
		  }

		  colonist.promotion.speed = 3 // random number for now
		  colonist.promotion.target = target

		  colonist.promotion.progress[target] +=
		    scale * colonist.promotion.speed

		  if (colonist.promotion.progress[target] >= 1) {
		    Unit.update.expert(colonist.unit, target)
		    Events.trigger('notification', {
		      type: 'learned',
		      colonist,
		      colony: colonist.colony,
		    })
		  }

		  Colonist.update.promotion(colonist)
    })

    return true
  }

  return {
    update,
    sort: 4,
  }
}




export default {
	create
}


