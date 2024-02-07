import { createSignal, createResource } from 'solid-js'
import { createStore } from 'solid-js/store'

import Util from 'util/util'

import DialogContext from 'view/ui/dialogContext'
import { fetchDialogs } from './templates'

const [dialogs] = createResource(() => fetchDialogs(DialogContext))
const [name, setName] = createSignal('')
const [staticData, setStaticData] = createSignal({})
const [context, setContext] = createStore({})

const hasDialog = (dialogName) => !!dialogName && !!dialogs() && !!dialogs()[dialogName]
const getDialog = () => hasDialog(name())
  ? dialogs()[name()]
  : null


let cleanup = null
export const open = (name, context = {}, handleData = () => {}) => {
  if (!hasDialog(name)) {
    console.error('Dialog not found', name, '\nThese dialogs are valid:', Object.keys(dialogs()))
    return () => {}
  }

  setContext(context)
  setName(name)
  const data = getDialog().data ?? {}
  setStaticData(data)

  if (cleanup) {
    console.warn('Dialog: Cleanup function should be null at this point')
  }
  cleanup = handleData(data)

  return close
}

export const close = () => {
  setName('')
  Util.execute(cleanup)
  cleanup = null
}


export default {
  name,
  setName,
  context,
  setContext,
  dialogs,
  hasDialog,
  getDialog,
  open,
  close
}
