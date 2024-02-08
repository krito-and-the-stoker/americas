import { createSignal, createResource } from 'solid-js'
import { createStore } from 'solid-js/store'

import Util from 'util/util'

import DialogContext from 'view/ui/dialogContext'
import { fetchDialogs } from './templates'

let dialogs
const hasDialog = (dialogName) => !!dialogName && !!dialogs() && !!dialogs()[dialogName]
const getDialog = (dialogName) => hasDialog(dialogName)
  ? dialogs()[dialogName]
  : null
const create = () => {
  if (!dialogs) {
    [dialogs] = createResource(() => fetchDialogs(DialogContext))
  }

  const [name, setName] = createSignal('')
  const [staticData, setStaticData] = createSignal({})
  const [context, setContext] = createStore({})


  let cleanup = null
  const open = (name, context = {}, handleData = () => {}) => {
    // console.log('open dialog', name)
    if (!hasDialog(name)) {
      console.error('Dialog not found', name, '\nThese dialogs are valid:', Object.keys(dialogs()))
      return () => {}
    }

    setContext(context)
    setName(name)
    const data = getDialog(name).data ?? {}
    setStaticData(data)

    if (cleanup) {
      console.warn('Dialog: Cleanup function should be null at this point')
    }
    cleanup = handleData(data)

    return close
  }

  const close = () => {
    setName('')
    Util.execute(cleanup)
    cleanup = null
  }

  return {    
    name,
    setName,
    context,
    setContext,
    open,
    close,
    dialogs,
    hasDialog,
    getDialog,
  }
}

// implement as singleton for now
let instance = null
const open = (...args) => {
  if (!instance) {
    instance = create()
  }

  instance.open(...args)
}

const close = () => {
  if (!instance) {
    instance = create()
  }

  instance.close()
}

const getInstance = () => {
  if (!instance) {
    instance = create()
  }

  return instance
}

export default {
  hasDialog,
  getDialog,
  open,
  close,
  getInstance,
}
