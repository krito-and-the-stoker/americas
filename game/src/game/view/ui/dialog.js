import LegacyDialog from './dialogLegacy'
import ReactiveDialog from 'ui/reactiveDialog'

const open = (name, context) => {
  // console.log('open', name, context)
  ReactiveDialog.open(name, context, data => {
    // console.log('data for', name, data)
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
