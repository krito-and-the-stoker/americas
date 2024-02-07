import LegacyDialog from './dialog-legacy'
import { dialogFns } from 'ui/Main'

const open = (name, context) => {
  console.log('open', name, context)
  dialogFns.open(name, context)
}

const close = () => {
  dialogFns.close()
}


export default {
  ...LegacyDialog,
  open,
  close,
}
