import Time from 'timeline/time'

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


export default {
  ...LegacyDialog,
  open,
  close,
}
