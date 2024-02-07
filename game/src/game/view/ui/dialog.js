import Time from 'timeline/time'
import Events from 'util/events'

import ReactiveDialog from 'ui/reactiveDialog'

import LegacyDialog from './dialogLegacy'

const open = (name, context) => {
  // console.log('open', name, context)
  ReactiveDialog.open(name, context, data => {
    // console.log('data for', name, data)
    Time.pause()
    return Time.resume
  })
}

const close = () => {
  ReactiveDialog.close()
}

const initialize = () => {
  Events.listen('ui-dialog', params => open(params.name, params.context))

  LegacyDialog.initialize()
}


export default {
  ...LegacyDialog,
  initialize,
  open,
  close,
}
